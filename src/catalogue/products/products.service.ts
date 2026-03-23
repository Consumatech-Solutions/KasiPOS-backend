import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { TempIdMappingsService } from '../../common/temp-id-mappings/temp-id-mappings.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminCreateProductDto } from './dto/admin-create-product.dto';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { AddTemplateDto } from './dto/add-template.dto';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductTemplate } from '../product-templates/entities/product-template.entity';
import { CategoryTemplate } from '../category-templates/entities/category-template.entity';
import { PaginationResult } from '../../common/dto/pagination.dto';
import { ILike, MoreThan } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(ProductTemplate)
    private productTemplatesRepository: Repository<ProductTemplate>,
    @InjectRepository(CategoryTemplate)
    private categoryTemplatesRepository: Repository<CategoryTemplate>,
    private tempIdMappingsService: TempIdMappingsService,
  ) {}

  // ==================== Non-Admin Methods ====================

  async create(createProductDto: CreateProductDto, storeId: string): Promise<Product> {
    const { _tempId, ...dto } = createProductDto;

    // Verify category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const existingProduct = await this.productsRepository.findOne({
      where: {
        name: createProductDto.name,
        storeId: storeId
      }
    })

    if(existingProduct) return existingProduct;

    const product = this.productsRepository.create({
      ...dto,
      category,
      storeId
    });
    const saved = await this.productsRepository.save(product);
    if (_tempId) {
      await this.tempIdMappingsService.saveMapping(_tempId, saved.id, 'product');
    }
    return saved;
  }

  async findAll(query: GetProductsDto, storeId: string): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10, search, categoryId, updatedAtAfter } = query;

    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (updatedAtAfter) {
      where.updatedAt = MoreThan(new Date(updatedAtAfter));
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
      relations: ['category', 'brand', 'store'],
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
      relations: ['category', 'brand', 'store'],
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

    const product = this.productsRepository.create({
      ...adminCreateProductDto,
      category,
      brandId: adminCreateProductDto.brandId,
      // Set default values for non-admin fields
    });
    return this.productsRepository.save(product);
  }

  async adminFindAll(query: GetProductsDto): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10, search, categoryId } = query;

    const queryBuilder = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.store', 'store');

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
      .orderBy('product.createdAt', 'DESC')
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

    // If storeId is being updated, verify the new store exists
    if (adminUpdateProductDto.storeId && adminUpdateProductDto.storeId !== product.storeId) {
      const store = await this.storesRepository.findOne({
        where: { id: adminUpdateProductDto.storeId },
      });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      product.store = store;
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

  // ==================== Store Admin: Add templates to own store ====================

  /**
   * Import category templates as categories and product templates as products for the store.
   * For each item: get category template, get or create category in store with that name;
   * then create products from the given product template IDs in that category.
   */
  async addTemplates(storeId: string, dto: AddTemplateDto): Promise<Product[]> {
    const store = await this.storesRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const created: Product[] = [];
    for (const item of dto.items) {
      const categoryTemplate = await this.categoryTemplatesRepository.findOne({
        where: { id: item.categoryTemplateId },
      });
      if (!categoryTemplate) {
        throw new NotFoundException(
          `Category template not found: ${item.categoryTemplateId}`,
        );
      }

      let category = await this.categoriesRepository.findOne({
        where: { storeId, name: categoryTemplate.name },
      });
      if (!category) {
        category = this.categoriesRepository.create({
          name: categoryTemplate.name,
          storeId: store.id,
          store,
        });
        category = await this.categoriesRepository.save(category);
      }

      for (const templateId of item.productTemplateIds) {
        const template = await this.productTemplatesRepository.findOne({
          where: { id: templateId },
          relations: ['categoryTemplate', 'brand'],
        });
        if (!template) {
          throw new NotFoundException(`Product template not found: ${templateId}`);
        }

        const productName = `${template.name} - ${store.name || store.id}`;
        const existing = await this.productsRepository.findOne({
          where: { name: productName },
        });
        if (existing) {
          throw new ConflictException(
            `A product named "${productName}" already exists. Template "${template.name}" may already be added to this store.`,
          );
        }

        const price = template.price ?? 0;
        const costPrice = template.costPrice ?? 0;

        const product = this.productsRepository.create({
          name: productName,
          categoryId: category.id,
          category,
          brandId: template.brandId ?? null,
          brand: template.brand ?? null,
          storeId: store.id,
          store,
          templateId: template.id,
          price,
          costPrice,
          stock: template.stock ?? null,
          barCode: template.barCode ?? null,
          productImage: template.productImage ?? null,
          lowStockThreshold: template.lowStockThreshold ?? null,
          supplier: template.supplier ?? null,
          unitOfMeasure: template.unitOfMeasure ?? null,
        });
        created.push(await this.productsRepository.save(product));
      }
    }
    return created;
  }
}
