import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminCreateProductDto } from './dto/admin-create-product.dto';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { PaginationResult } from '../../common/dto/pagination.dto';
import { ILike } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) { }

  // ==================== Non-Admin Methods ====================

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verify category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: createProductDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const existing = await this.productsRepository.findOne({
      where: { name: createProductDto.name },
    });
    if (existing) {
      throw new ConflictException(`A product with the name "${createProductDto.name}" already exists.`);
    }

    const product = this.productsRepository.create({
      ...createProductDto,
      category,
    });
    return this.productsRepository.save(product);
  }

  async findAll(query: GetProductsDto): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10, search, categoryId } = query;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    let whereClause: any = where;
    if (search) {
      whereClause = [
        { ...where, name: ILike(`%${search}%`) },
        { ...where, barCode: ILike(`%${search}%`) }
      ];
    }

    const [data, total] = await this.productsRepository.findAndCount({
      where: whereClause,
      relations: ['category', 'brand'],
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // If categoryId is being updated, verify the new category exists
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
      product.categoryId = updateProductDto.categoryId;
    }

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existing = await this.productsRepository.findOne({
        where: { name: updateProductDto.name },
      });
      if (existing) {
        throw new ConflictException(`A product with the name "${updateProductDto.name}" already exists.`);
      }
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  // ==================== Admin-Only Methods ====================

  async adminCreate(adminCreateProductDto: AdminCreateProductDto): Promise<Product> {
    // Verify category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: adminCreateProductDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify brand exists
    const brand = await this.brandsRepository.findOne({
      where: { id: adminCreateProductDto.brandId },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const existing = await this.productsRepository.findOne({
      where: { name: adminCreateProductDto.name },
    });
    if (existing) {
      throw new ConflictException(`A product with the name "${adminCreateProductDto.name}" already exists.`);
    }

    const product = this.productsRepository.create({
      ...adminCreateProductDto,
      category,
      brand,
      // Set default values for non-admin fields
      price: 0,
      costPrice: 0,
    });
    return this.productsRepository.save(product);
  }

  async adminFindAll(query: GetProductsDto): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10, search, categoryId } = query;

    const queryBuilder = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand');

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.bar_code ILIKE :search OR product.supplier ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.category_id = :categoryId', { categoryId });
    }

    queryBuilder
      .orderBy('product.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

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

  async adminFindOne(id: string): Promise<Product> {
    return this.findOne(id);
  }

  async adminUpdate(id: string, adminUpdateProductDto: AdminUpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // If categoryId is being updated, verify the new category exists
    if (adminUpdateProductDto.categoryId && adminUpdateProductDto.categoryId !== product.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: adminUpdateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }

    // If brandId is being updated, verify the new brand exists
    if (adminUpdateProductDto.brandId && adminUpdateProductDto.brandId !== product.brandId) {
      const brand = await this.brandsRepository.findOne({
        where: { id: adminUpdateProductDto.brandId },
      });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
      product.brand = brand;
    }

    if (adminUpdateProductDto.name && adminUpdateProductDto.name !== product.name) {
      const existing = await this.productsRepository.findOne({
        where: { name: adminUpdateProductDto.name },
      });
      if (existing) {
        throw new ConflictException(`A product with the name "${adminUpdateProductDto.name}" already exists.`);
      }
    }

    Object.assign(product, adminUpdateProductDto);
    return this.productsRepository.save(product);
  }

  async adminRemove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
