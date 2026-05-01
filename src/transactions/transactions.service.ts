import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { PendingTransaction } from './entities/pending-transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Product } from '../catalogue/products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { VouchersService } from '../vouchers/vouchers.service';
import { TempIdMappingsService } from '../common/temp-id-mappings/temp-id-mappings.service';
import { SettingsService } from '../settings/settings.service';
import { CreateTransactionResult } from './types/create-transaction-result.type';
import { StockAdjustment, StockAdjustmentReason } from '../stock-adjustments/entities/stock-adjustment.entity';

export const TEMP_ID_PATTERN = /^temp-\d+$/;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(PendingTransaction)
    private readonly pendingTransactionsRepository: Repository<PendingTransaction>,
    private readonly vouchersService: VouchersService,
    private readonly tempIdMappingsService: TempIdMappingsService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<CreateTransactionResult> {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'Transaction must contain at least one item',
      );
    }

    const dtoResolved: CreateTransactionDto = {
      ...dto,
      items: dto.items.map((item) => ({ ...item })),
    };

    let isOfflineRequest = false;
    let pendingCustomerTempId: string | null = null;
    let customerTempUnresolved = false;

    if (dto.customerId && TEMP_ID_PATTERN.test(String(dto.customerId))) {
      const resolved = await this.tempIdMappingsService.resolveId(
        String(dto.customerId),
      );
      if (resolved) {
        dtoResolved.customerId = resolved;
      } else {
        customerTempUnresolved = true;
        delete dtoResolved.customerId;
        if (dto.paymentMethod !== 'Credit') {
          pendingCustomerTempId = String(dto.customerId);
        }
      }
    }

    let anyProductTempUnresolved = false;
    for (let i = 0; i < dtoResolved.items.length; i++) {
      const id = String(dtoResolved.items[i].productId ?? '');
      if (TEMP_ID_PATTERN.test(id)) {
        const resolved = await this.tempIdMappingsService.resolveId(id);
        if (resolved) {
          dtoResolved.items[i].productId = resolved;
          isOfflineRequest = true;
        } else {
          anyProductTempUnresolved = true;
        }
      }
    }

    if (
      anyProductTempUnresolved ||
      (dto.paymentMethod === 'Credit' && customerTempUnresolved)
    ) {
      const unresolved = await this.computeUnresolvedTempIds(dto);
      const row = this.pendingTransactionsRepository.create({
        storeId: dto.storeId,
        payload: {
          ...dto,
          items: dto.items.map((item) => ({ ...item })),
        },
        unresolvedTempIds: unresolved,
      });
      const saved = await this.pendingTransactionsRepository.save(row);
      return { status: 'pending', pendingTransactionId: saved.id };
    }

    this.validateDiscount(dtoResolved);

    if (dtoResolved.paymentMethod === 'Credit' && !dtoResolved.customerId) {
      throw new BadRequestException(
        'Customer is required when payment method is Credit.',
      );
    }

    const transaction = await this.commitResolvedTransaction(dtoResolved, {
      isOfflineRequest,
      pendingCustomerTempId,
    });

    return { status: 'committed', transaction };
  }

  /** Public for PendingTransactionSyncService */
  async computeUnresolvedTempIds(
    dto: CreateTransactionDto,
  ): Promise<string[]> {
    const ids: string[] = [];
    if (dto.customerId && TEMP_ID_PATTERN.test(String(dto.customerId))) {
      const r = await this.tempIdMappingsService.resolveId(
        String(dto.customerId),
      );
      if (!r) ids.push(String(dto.customerId));
    }
    for (const item of dto.items) {
      const pid = String(item.productId);
      if (TEMP_ID_PATTERN.test(pid)) {
        const r = await this.tempIdMappingsService.resolveId(pid);
        if (!r) ids.push(pid);
      }
    }
    return [...new Set(ids)];
  }

  async resolveAllTempIdsInDto(
    dto: CreateTransactionDto,
  ): Promise<CreateTransactionDto> {
    const out: CreateTransactionDto = {
      ...dto,
      items: dto.items.map((item) => ({ ...item })),
    };
    if (out.customerId && TEMP_ID_PATTERN.test(String(out.customerId))) {
      const r = await this.tempIdMappingsService.resolveId(
        String(out.customerId),
      );
      if (r) out.customerId = r;
    }
    for (let i = 0; i < out.items.length; i++) {
      const pid = String(out.items[i].productId);
      if (TEMP_ID_PATTERN.test(pid)) {
        const r = await this.tempIdMappingsService.resolveId(pid);
        if (r) out.items[i].productId = r;
      }
    }
    return out;
  }

  async patchTransactionsForCustomerTemp(
    tempId: string,
    serverId: string,
    storeId?: string | null,
  ): Promise<void> {
    const where =
      storeId != null && storeId !== ''
        ? { pendingCustomerTempId: tempId, storeId }
        : { pendingCustomerTempId: tempId };
    await this.transactionsRepository.update(where, {
      customerId: serverId,
      pendingCustomerTempId: null,
    });
  }

  async commitResolvedTransactionAndDeletePending(
    dto: CreateTransactionDto,
    options: { isOfflineRequest: boolean; pendingCustomerTempId: string | null },
    pendingId: string,
  ): Promise<Transaction> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const tx = await this.persistTransaction(manager, dto, options);
      await manager.getRepository(PendingTransaction).delete(pendingId);
      return tx;
    });
    this.enqueueVoucherUsage(dto, saved);
    return saved;
  }

  private async commitResolvedTransaction(
    dto: CreateTransactionDto,
    options: { isOfflineRequest: boolean; pendingCustomerTempId: string | null },
  ): Promise<Transaction> {
    const saved = await this.dataSource.transaction(async (manager) => {
      return this.persistTransaction(manager, dto, options);
    });
    this.enqueueVoucherUsage(dto, saved);
    return saved;
  }

  private enqueueVoucherUsage(
    dto: CreateTransactionDto,
    saved: Transaction,
  ): void {
    if (dto.voucherCode) {
      this.vouchersService
        .recordUsage(
          dto.voucherCode,
          dto.storeId,
          dto.customerId ?? undefined,
        )
        .catch((err) => {
          console.error('Failed to record voucher usage:', err);
        });
    }
  }

  private validateDiscount(dto: CreateTransactionDto): void {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    if (dto.discount) {
      if (dto.discount.discountType === 'amount') {
        if (Number(dto.discount.discountAmount) > subtotal) {
          throw new BadRequestException(
            `Discount amount cannot exceed cart subtotal (${subtotal})`,
          );
        }
      } else {
        if (Number(dto.discount.discountAmount) > 100) {
          throw new BadRequestException(
            'Discount percentage cannot exceed 100',
          );
        }
      }
    }
  }

  private async persistTransaction(
    manager: EntityManager,
    dtoResolved: CreateTransactionDto,
    options: { isOfflineRequest: boolean; pendingCustomerTempId: string | null },
  ): Promise<Transaction> {
    const { isOfflineRequest, pendingCustomerTempId } = options;

    for (const item of dtoResolved.items) {
      const product = await manager.getRepository(Product).findOne({
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      const currentStock = product.stock ?? 0;
      let nextStock = currentStock - item.quantity;

      if (nextStock < 0) {
        if (!isOfflineRequest) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }
        
        // Auto-increase for offline sale fulfillment
        const deficit = Math.abs(nextStock);
        const adjustment = new StockAdjustment();
        adjustment.productId = product.id;
        adjustment.productName = product.name;
        adjustment.oldStock = currentStock;
        adjustment.newStock = currentStock + deficit;
        adjustment.reason = StockAdjustmentReason.NEW_STOCK_RECEIVED;
        adjustment.note = 'Auto-increase for offline sale fulfillment';
        adjustment.storeId = dtoResolved.storeId;
        await manager.getRepository(StockAdjustment).save(adjustment);
        
        nextStock = 0; // after auto-increasing, the stock remaining will be 0
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
      const creditSettings = await this.settingsService.getCreditSettings(
        dtoResolved.storeId,
      );
      if (
        !creditSettings?.customerCredit ||
        creditSettings.customerCredit.creditLimit == null
      ) {
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
      pendingCustomerTempId,
      items: dtoResolved.items,
      paymentMethod: dtoResolved.paymentMethod,
      total: dtoResolved.total,
      voucherCode: dtoResolved.voucherCode ?? null,
      discount: dtoResolved.discount ?? null,
      creditDetails,
    });

    return manager.getRepository(Transaction).save(tx);
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

    if (customerId) {
      queryBuilder.andWhere('transaction.customerId = :customerId', {
        customerId,
      });
    }

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
