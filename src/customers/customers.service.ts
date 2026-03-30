import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThan } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TempIdMappingsService } from '../common/temp-id-mappings/temp-id-mappings.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetCustomersDto } from './dto/get-customers.dto';
import { WelcomeSmsService } from '../services/welcome-sms.service';
import { PendingTransactionSyncService } from '../transactions/pending-transaction-sync.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private tempIdMappingsService: TempIdMappingsService,
    private welcomeSmsService: WelcomeSmsService,
    private pendingTransactionSyncService: PendingTransactionSyncService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    tempIdFromBody?: string,
    storeId?: string,
  ): Promise<Customer> {
    const _tempId = createCustomerDto._tempId ?? tempIdFromBody;
    const { _tempId: __, storeId: dtoStoreId, ...dto } = createCustomerDto;
    const resolvedStoreId = storeId ?? dtoStoreId ?? null;

    const customer = this.customersRepository.create({
      ...dto,
      loyaltyPoints: dto.loyaltyPoints ?? 0,
      ...(resolvedStoreId != null && { storeId: resolvedStoreId }),
    });
    const saved = await this.customersRepository.save(customer);
    if (_tempId) {
      await this.tempIdMappingsService.saveMapping(_tempId, saved.id, 'customer');
      await this.pendingTransactionSyncService.onCustomerMapped(
        _tempId,
        saved.id,
        saved.storeId,
      );
    }
    // Send welcome SMS (non-blocking: do not fail customer creation if SMS fails)
    if (saved.contact?.trim()) {
      this.welcomeSmsService
        .sendWelcome(saved.contact, saved.name)
        .catch((err) => {
          this.logger.warn('Welcome SMS failed (customer was created)', err?.message ?? err);
        });
    }
    return saved;
  }

  async findAll(
    query: GetCustomersDto,
    storeId?: string,
  ): Promise<PaginationResult<Customer>> {
    const { page = 1, limit = 10, search, updatedAtAfter } = query;

    const baseWhere: any = {};
    if (updatedAtAfter) {
      baseWhere.updatedAt = MoreThan(new Date(updatedAtAfter));
    }
    if (storeId) {
      baseWhere.storeId = storeId;
    }

    let whereClause: any = baseWhere;
    if (search) {
      whereClause = [
        { ...baseWhere, name: ILike(`%${search}%`) },
        { ...baseWhere, contact: ILike(`%${search}%`) },
      ];
    }

    const [data, total] = await this.customersRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(id: string, storeId?: string): Promise<Customer> {
    const where: { id: string; storeId?: string } = { id };
    if (storeId) {
      where.storeId = storeId;
    }
    const customer = await this.customersRepository.findOne({
      where,
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    storeId?: string,
  ): Promise<Customer> {
    const customer = await this.findOne(id, storeId);
    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string, storeId?: string): Promise<void> {
    const customer = await this.findOne(id, storeId);
    await this.customersRepository.softRemove(customer);
  }
}
