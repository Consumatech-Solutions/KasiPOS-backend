import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MarketplaceOrder,
  MarketplaceOrderStatus,
} from './entities/marketplace-order.entity';
import { CreateMarketplaceOrderDto } from './dto/create-marketplace-order.dto';
import { UpdateMarketplaceOrderDto } from './dto/update-marketplace-order.dto';
import { GetMarketplaceOrdersDto } from './dto/get-marketplace-orders.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class MarketplaceOrdersService {
  constructor(
    @InjectRepository(MarketplaceOrder)
    private marketplaceOrdersRepository: Repository<MarketplaceOrder>,
  ) {}

  private generateOrderCode(): string {
    const prefix = 'MP-';
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return prefix + randomNum;
  }

  async create(
    dto: CreateMarketplaceOrderDto,
    storeId: string,
  ): Promise<MarketplaceOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Marketplace order must contain at least one item',
      );
    }

    // Generate unique order code
    let orderCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      orderCode = this.generateOrderCode();
      const existing = await this.marketplaceOrdersRepository.findOne({
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

    const order = this.marketplaceOrdersRepository.create({
      orderCode: orderCode!,
      marketplaceStoreId: dto.marketplaceStoreId,
      storeId,
      customerId: dto.customerId || null,
      items: dto.items,
      subtotal: dto.subtotal,
      vatAmount: dto.vatAmount || 0,
      serviceFee: dto.serviceFee || 0,
      total: dto.total,
      paymentMethod: dto.paymentMethod,
      status: MarketplaceOrderStatus.PENDING,
    });

    return this.marketplaceOrdersRepository.save(order);
  }

  async findAll(
    query: GetMarketplaceOrdersDto,
    storeId: string,
  ): Promise<PaginationResult<MarketplaceOrder>> {
    const {
      page = 1,
      limit = 10,
      marketplaceStoreId,
      customerId,
      status,
      search,
    } = query;

    const queryBuilder = this.marketplaceOrdersRepository
      .createQueryBuilder('order')
      .where('order.storeId = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC');

    if (marketplaceStoreId) {
      queryBuilder.andWhere('order.marketplaceStoreId = :marketplaceStoreId', {
        marketplaceStoreId,
      });
    }

    if (customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('order.orderCode ILike :search', {
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

  async findOne(id: string, storeId: string): Promise<MarketplaceOrder> {
    const order = await this.marketplaceOrdersRepository.findOne({
      where: { id, storeId },
      relations: ['store'],
    });

    if (!order) {
      throw new NotFoundException(`Marketplace order not found: ${id}`);
    }

    return order;
  }

  async findByOrderCode(
    orderCode: string,
    storeId: string,
  ): Promise<MarketplaceOrder> {
    const order = await this.marketplaceOrdersRepository.findOne({
      where: { orderCode, storeId },
      relations: ['store'],
    });

    if (!order) {
      throw new NotFoundException(
        `Marketplace order not found with code: ${orderCode}`,
      );
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateMarketplaceOrderDto,
    storeId: string,
  ): Promise<MarketplaceOrder> {
    const order = await this.findOne(id, storeId);

    if (dto.status !== undefined) {
      order.status = dto.status as MarketplaceOrderStatus;
    }

    return this.marketplaceOrdersRepository.save(order);
  }
}
