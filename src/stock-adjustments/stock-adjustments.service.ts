import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockAdjustment, StockAdjustmentReason } from './entities/stock-adjustment.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { GetStockAdjustmentsDto } from './dto/get-stock-adjustments.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @InjectRepository(StockAdjustment)
    private stockAdjustmentsRepository: Repository<StockAdjustment>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateStockAdjustmentDto, storeId: number): Promise<StockAdjustment> {
    return this.dataSource.transaction(async (manager) => {
      // Get product with lock to prevent race conditions
      const product = await manager.getRepository(Product).findOne({
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${dto.productId}`);
      }

      const oldStock = product.stock ?? 0;

      // Create adjustment record
      const adjustment = manager.getRepository(StockAdjustment).create({
        productId: dto.productId,
        productName: product.name,
        oldStock,
        newStock: dto.newStock,
        reason: dto.reason as StockAdjustmentReason,
        note: dto.note ?? null,
        storeId,
      });

      // Update product stock
      product.stock = dto.newStock;
      await manager.getRepository(Product).save(product);

      // Save adjustment
      return manager.getRepository(StockAdjustment).save(adjustment);
    });
  }

  async findAll(query: GetStockAdjustmentsDto, storeId: number): Promise<PaginationResult<StockAdjustment>> {
    const { page = 1, limit = 10, productId } = query;

    const where: any = { storeId };
    if (productId) {
      where.productId = productId;
    }

    const [data, total] = await this.stockAdjustmentsRepository.findAndCount({
      where,
      relations: ['product', 'store'],
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

  async findByProduct(productId: string, storeId: number): Promise<StockAdjustment[]> {
    return this.stockAdjustmentsRepository.find({
      where: { productId, storeId },
      relations: ['product', 'store'],
      order: { createdAt: 'DESC' },
    });
  }
}
