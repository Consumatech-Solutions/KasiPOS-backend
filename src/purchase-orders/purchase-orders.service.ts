import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { GetPurchaseOrdersDto } from './dto/get-purchase-orders.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { Product } from '../catalogue/products/entities/product.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  private generateOrderCode(): string {
    const prefix = 'PO-';
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return prefix + randomNum;
  }

  async create(
    dto: CreatePurchaseOrderDto,
    storeId: string,
  ): Promise<PurchaseOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Purchase order must contain at least one item',
      );
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

  async findAll(
    query: GetPurchaseOrdersDto,
    storeId: string,
  ): Promise<PaginationResult<PurchaseOrder>> {
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

  async findOne(id: string, storeId: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrdersRepository.findOne({
      where: { id, storeId },
      relations: ['store'],
    });

    if (!order) {
      throw new NotFoundException(`Purchase order not found: ${id}`);
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdatePurchaseOrderDto,
    storeId: string,
  ): Promise<PurchaseOrder> {
    const order = await this.findOne(id, storeId);
    const previousStatus = order.status;
    const newStatus = dto.status as PurchaseOrderStatus;

    // If status is changing to completed, update product stock
    if (
      dto.status !== undefined &&
      newStatus === PurchaseOrderStatus.COMPLETED &&
      previousStatus !== PurchaseOrderStatus.COMPLETED
    ) {
      return this.dataSource.transaction(async (manager) => {
        // Update order status
        order.status = newStatus;
        const savedOrder = await manager
          .getRepository(PurchaseOrder)
          .save(order);

        // Update stock for each product in the order
        for (const item of order.items) {
          const product = await manager.getRepository(Product).findOne({
            where: { id: item.productId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!product) {
            console.warn(
              `Product not found: ${item.productId} in purchase order ${order.orderCode}`,
            );
            continue;
          }

          // Increase stock by the quantity ordered
          const currentStock = product.stock ?? 0;
          product.stock = currentStock + item.quantity;
          await manager.getRepository(Product).save(product);
        }

        return savedOrder;
      });
    }

    // For other status changes, just update the status
    if (dto.status !== undefined) {
      order.status = newStatus;
    }

    return this.purchaseOrdersRepository.save(order);
  }
}
