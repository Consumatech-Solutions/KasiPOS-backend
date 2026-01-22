import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetCustomersDto } from './dto/get-customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) { }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...createCustomerDto,
      loyaltyPoints: createCustomerDto.loyaltyPoints ?? 0,
    });
    return this.customersRepository.save(customer);
  }

  async findAll(query: GetCustomersDto): Promise<PaginationResult<Customer>> {
    const { page = 1, limit = 10, search } = query;

    let whereClause: any = {};
    if (search) {
      whereClause = [
        { name: ILike(`%${search}%`) },
        { contact: ILike(`%${search}%`) },
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
