import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Product } from '../catalogue/products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { VouchersService } from '../vouchers/vouchers.service';
import { TempIdMappingsService } from '../common/temp-id-mappings/temp-id-mappings.service';
import { SettingsService } from '../settings/settings.service';

const TEMP_ID_PATTERN = /^temp-\d+$/;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly vouchersService: VouchersService,
    private readonly tempIdMappingsService: TempIdMappingsService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'Transaction must contain at least one item',
      );
    }

    const dtoResolved = { ...dto, items: dto.items.map((item) => ({ ...item })) };
    if (dto.customerId && TEMP_ID_PATTERN.test(String(dto.customerId))) {
      const resolved = await this.tempIdMappingsService.resolveId(String(dto.customerId));
      if (!resolved) {
        throw new BadRequestException(
          'Customer is not yet synced. Please wait for sync to complete and try again.',
        );
      }
      dtoResolved.customerId = resolved;
    }
    for (let i = 0; i < dtoResolved.items.length; i++) {
      const id = String(dtoResolved.items[i].productId ?? '');
      if (TEMP_ID_PATTERN.test(id)) {
        const resolved = await this.tempIdMappingsService.resolveId(id);
        if (!resolved) {
          throw new BadRequestException(
            `Product (${id}) is not yet synced. Save or sync products first, then try again.`,
          );
        }
        dtoResolved.items[i].productId = resolved;
      }
    }

    // Validate discount: amount must not exceed cart subtotal; percentage must not exceed 100
    const subtotal = dtoResolved.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    if (dtoResolved.discount) {
      if (dtoResolved.discount.discountType === 'amount') {
        if (Number(dtoResolved.discount.discountAmount) > subtotal) {
          throw new BadRequestException(
            `Discount amount cannot exceed cart subtotal (${subtotal})`,
          );
        }
      } else {
        if (Number(dtoResolved.discount.discountAmount) > 100) {
          throw new BadRequestException(
            'Discount percentage cannot exceed 100',
          );
        }
      }
    }

    if (dtoResolved.paymentMethod === 'Credit') {
      if (!dtoResolved.customerId) {
        throw new BadRequestException('Customer is required when payment method is Credit.');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock products (pessimistic write) to prevent race conditions on stock
      for (const item of dtoResolved.items) {
        const product = await manager.getRepository(Product).findOne({
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        const currentStock = product.stock ?? 0;
        const nextStock = currentStock - item.quantity;
        if (nextStock < 0) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        product.stock = nextStock;
        await manager.getRepository(Product).save(product);
      }

      let creditDetails: { paymentDate?: string; note?: string } | null = null;
      if (dtoResolved.paymentMethod === 'Credit') {
        const customerId = dtoResolved.customerId!;
        const customer = await manager.getRepository(Customer).findOne({
          where: { id: customerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!customer) {
          throw new NotFoundException(`Customer not found: ${customerId}`);
        }
        const creditSettings = await this.settingsService.getCreditSettings(dtoResolved.storeId);
        if (!creditSettings?.customerCredit || creditSettings.customerCredit.creditLimit == null) {
          throw new BadRequestException(
            'Credit is not configured for this store. Set customer credit limit in store settings.',
          );
        }
        const limit = Number(creditSettings.customerCredit.creditLimit);
        const currentOutstanding = Number(customer.outstandingCredit ?? 0);
        const totalNum = Number(dtoResolved.total);
        if (currentOutstanding + totalNum > limit) {
          const maxAllowed = Math.max(0, limit - currentOutstanding);
          throw new BadRequestException(
            `Credit limit exceeded. Customer outstanding: ${currentOutstanding}, limit: ${limit}. Maximum additional credit allowed for this transaction: ${maxAllowed}.`,
          );
        }
        customer.outstandingCredit = currentOutstanding + totalNum;
        await manager.getRepository(Customer).save(customer);
        creditDetails = dtoResolved.creditDetails ?? {};
      }

      const tx = manager.getRepository(Transaction).create({
        storeId: dtoResolved.storeId,
        customerId: dtoResolved.customerId ?? null,
        items: dtoResolved.items,
        paymentMethod: dtoResolved.paymentMethod,
        total: dtoResolved.total,
        voucherCode: dtoResolved.voucherCode ?? null,
        discount: dtoResolved.discount ?? null,
        creditDetails,
      });

      const savedTransaction = await manager
        .getRepository(Transaction)
        .save(tx);

      // Record voucher usage if voucher was applied
      if (dtoResolved.voucherCode) {
        // Record usage outside transaction to avoid deadlocks
        // This is safe because validation already happened on frontend
        this.vouchersService
          .recordUsage(
            dtoResolved.voucherCode,
            dtoResolved.storeId,
            dtoResolved.customerId ?? undefined,
          )
          .catch((err) => {
            // Log error but don't fail transaction
            console.error('Failed to record voucher usage:', err);
          });
      }

      return savedTransaction;
    });
  }

  async findAll(
    query: GetTransactionsDto,
    storeId: string,
  ): Promise<PaginationResult<Transaction>> {
    const { page = 1, limit = 10, date, customerId, search } = query;

    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.storeId = :storeId', { storeId })
      .orderBy('transaction.createdAt', 'DESC');

    // Filter by date (if provided, filter by that specific date)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder.andWhere('transaction.createdAt >= :startOfDay', {
        startOfDay,
      });
      queryBuilder.andWhere('transaction.createdAt <= :endOfDay', { endOfDay });
    }

    // Filter by customer ID
    if (customerId) {
      queryBuilder.andWhere('transaction.customerId = :customerId', {
        customerId,
      });
    }

    // Search by transaction ID (partial match)
    if (search) {
      queryBuilder.andWhere('transaction.id::text LIKE :search', {
        search: `%${search}%`,
      });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, storeId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, storeId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${id}`);
    }

    return transaction;
  }
}
