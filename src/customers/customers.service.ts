import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThan } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TempIdMappingsService } from '../common/temp-id-mappings/temp-id-mappings.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetCustomersDto } from './dto/get-customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private tempIdMappingsService: TempIdMappingsService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    tempIdFromBody?: string,
  ): Promise<Customer> {
    const _tempId = createCustomerDto._tempId ?? tempIdFromBody;
    const { _tempId: _, ...dto } = createCustomerDto;

    const customer = this.customersRepository.create({
      ...dto,
      loyaltyPoints: dto.loyaltyPoints ?? 0,
    });
    const saved = await this.customersRepository.save(customer);
    if (_tempId) {
      await this.tempIdMappingsService.saveMapping(_tempId, saved.id, 'customer');
    }
    return saved;
  }

  async findAll(query: GetCustomersDto): Promise<PaginationResult<Customer>> {
    const { page = 1, limit = 10, search, updatedAtAfter } = query;

    const baseWhere: any = {};
    if (updatedAtAfter) {
      baseWhere.updatedAt = MoreThan(new Date(updatedAtAfter));
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

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }
}
