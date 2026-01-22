import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { GetPurchaseOrdersDto } from './dto/get-purchase-orders.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
  ) {}

  private generateOrderCode(): string {
    const prefix = 'PO-';
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return prefix + randomNum;
  }

  async create(dto: CreatePurchaseOrderDto, storeId: number): Promise<PurchaseOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase order must contain at least one item');
    }

    // Generate unique order code
    let orderCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      orderCode = this.generateOrderCode();
      const existing = await this.purchaseOrdersRepository.findOne({
        where: { orderCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique order code');
    }

    const order = this.purchaseOrdersRepository.create({
      orderCode: orderCode!,
      storeId,
      items: dto.items,
      subtotal: dto.subtotal,
      deliveryFee: dto.deliveryFee,
      total: dto.total,
      deliveryMethod: dto.deliveryMethod,
      status: PurchaseOrderStatus.PENDING,
    });

    return this.purchaseOrdersRepository.save(order);
  }

  async findAll(query: GetPurchaseOrdersDto, storeId: number): Promise<PaginationResult<PurchaseOrder>> {
    const { page = 1, limit = 10 } = query;

    const [data, total] = await this.purchaseOrdersRepository.findAndCount({
      where: { storeId },
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

  async findOne(id: string, storeId: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id, storeId },
      relations: ['store'],
    });

    if (!order) {
      throw new NotFoundException(`Purchase order not found: ${id}`);
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdatePurchaseOrderDto, storeId: number): Promise<PurchaseOrder> {
    const order = await this.findOne(id, storeId);

    if (dto.status !== undefined) {
      order.status = dto.status as PurchaseOrderStatus;
    }

    return this.purchaseOrdersRepository.save(order);
  }
}
