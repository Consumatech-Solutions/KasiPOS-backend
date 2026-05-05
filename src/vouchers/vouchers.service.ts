import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherType } from './entities/voucher.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GetVouchersDto } from './dto/get-vouchers.dto';
import {
  ValidateVoucherDto,
  ValidateVoucherResponseDto,
} from './dto/validate-voucher.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private vouchersRepository: Repository<Voucher>,
  ) {}

  async create(dto: CreateVoucherDto, storeId: string): Promise<Voucher> {
    // Check if code already exists for this store
    const existing = await this.vouchersRepository.findOne({
      where: { code: dto.code.toUpperCase(), storeId },
    });

    if (existing) {
      throw new ConflictException(
        `A voucher with code "${dto.code}" already exists for this store.`,
      );
    }

    const voucher = this.vouchersRepository.create({
      code: dto.code.toUpperCase(),
      type: dto.type as VoucherType,
      value: dto.value,
      minPurchase: dto.minPurchase,
      isActive: dto.isActive ?? true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      maxUses: dto.maxUses ?? null,
      maxUsesPerCustomer: dto.maxUsesPerCustomer ?? null,
      currentUses: 0,
      customerUsages: null,
      storeId,
    });

    return this.vouchersRepository.save(voucher);
  }

  async findAll(
    query: GetVouchersDto,
    storeId: string,
  ): Promise<PaginationResult<Voucher>> {
    const { page = 1, limit = 10, isActive } = query;

    const where: any = { storeId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await this.vouchersRepository.findAndCount({
      where,
      relations: ['store'],
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

  async findOne(id: string, storeId: string): Promise<Voucher> {
    const voucher = await this.vouchersRepository.findOne({
      where: { id, storeId },
      relations: ['store'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher not found: ${id}`);
    }

    return voucher;
  }

  async update(
    id: string,
    dto: UpdateVoucherDto,
    storeId: string,
  ): Promise<Voucher> {
    const voucher = await this.findOne(id, storeId);

    // Don't allow code changes
    if (dto.code && dto.code.toUpperCase() !== voucher.code) {
      throw new BadRequestException(
        'Voucher code cannot be changed after creation',
      );
    }

    // Check if new code conflicts with existing voucher
    if (dto.code) {
      const existing = await this.vouchersRepository.findOne({
        where: { code: dto.code.toUpperCase(), storeId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A voucher with code "${dto.code}" already exists for this store.`,
        );
      }
    }

    if (dto.code) {
      voucher.code = dto.code.toUpperCase();
    }
    if (dto.type !== undefined) {
      voucher.type = dto.type as VoucherType;
    }
    if (dto.value !== undefined) {
      voucher.value = dto.value;
    }
    if (dto.minPurchase !== undefined) {
      voucher.minPurchase = dto.minPurchase;
    }
    if (dto.isActive !== undefined) {
      voucher.isActive = dto.isActive;
    }
    if (dto.expiresAt !== undefined) {
      voucher.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    if (dto.maxUses !== undefined) {
      voucher.maxUses = dto.maxUses;
    }
    if (dto.maxUsesPerCustomer !== undefined) {
      voucher.maxUsesPerCustomer = dto.maxUsesPerCustomer;
    }

    return this.vouchersRepository.save(voucher);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const voucher = await this.findOne(id, storeId);
    await this.vouchersRepository.softRemove(voucher);
  }

  async validate(
    dto: ValidateVoucherDto,
    storeId: string,
  ): Promise<ValidateVoucherResponseDto> {
    const voucher = await this.vouchersRepository.findOne({
      where: { code: dto.code.toUpperCase(), storeId },
    });

    if (!voucher) {
      return {
        valid: false,
        message: 'Voucher code is invalid.',
      };
    }

    // Check if active
    if (!voucher.isActive) {
      return {
        valid: false,
        message: 'This voucher is not active.',
      };
    }

    // Check expiration
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return {
        valid: false,
        message: 'This voucher has expired.',
      };
    }

    // Check minimum purchase
    if (dto.cartTotal < voucher.minPurchase) {
      return {
        valid: false,
        message: `A minimum purchase of R${Number(voucher.minPurchase).toFixed(2)} is required for this voucher.`,
      };
    }

    // Check max uses (total)
    if (voucher.maxUses !== null && voucher.currentUses >= voucher.maxUses) {
      return {
        valid: false,
        message: 'This voucher has reached its maximum usage limit.',
      };
    }

    // Check max uses per customer
    if (dto.customerId && voucher.maxUsesPerCustomer !== null) {
      const customerUsages = voucher.customerUsages || {};
      const customerUsageCount = customerUsages[dto.customerId] || 0;
      if (customerUsageCount >= voucher.maxUsesPerCustomer) {
        return {
          valid: false,
          message: 'You have reached the maximum usage limit for this voucher.',
        };
      }
    }

    // Calculate discount amount
    let discountAmount: number;
    if (voucher.type === VoucherType.PERCENTAGE) {
      discountAmount = (dto.cartTotal * Number(voucher.value)) / 100;
    } else {
      discountAmount = Number(voucher.value);
    }

    // Don't allow discount to exceed cart total
    discountAmount = Math.min(discountAmount, dto.cartTotal);

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        type: voucher.type,
        value: Number(voucher.value),
      },
      discountAmount,
    };
  }

  async recordUsage(
    code: string,
    storeId: string,
    customerId?: string,
  ): Promise<void> {
    const voucher = await this.vouchersRepository.findOne({
      where: { code: code.toUpperCase(), storeId },
    });

    if (!voucher) {
      return; // Voucher not found, skip recording
    }

    // Increment total uses
    voucher.currentUses += 1;

    // Increment per-customer uses if customerId provided
    if (customerId && voucher.maxUsesPerCustomer !== null) {
      const customerUsages = voucher.customerUsages || {};
      customerUsages[customerId] = (customerUsages[customerId] || 0) + 1;
      voucher.customerUsages = customerUsages;
    }

    await this.vouchersRepository.save(voucher);
  }
}
