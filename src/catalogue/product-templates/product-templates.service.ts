import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { ProductTemplate } from './entities/product-template.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Store } from '../../stores/entities/store.entity';
import { CreateProductTemplateDto } from './dto/create-product-template.dto';
import { UpdateProductTemplateDto } from './dto/update-product-template.dto';
import { GetProductTemplatesDto } from './dto/get-product-templates.dto';
import { AssignTemplateToStoreDto } from './dto/assign-template-to-store.dto';
import { AssignTemplateToAllStoresDto } from './dto/assign-template-to-all-stores.dto';
import { PaginationResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductTemplatesService {
  constructor(
    @InjectRepository(ProductTemplate)
    private productTemplatesRepository: Repository<ProductTemplate>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(dto: CreateProductTemplateDto): Promise<ProductTemplate> {
    const existing = await this.productTemplatesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `A product template with the name "${dto.name}" already exists.`,
      );
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoriesRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    let brand: Brand | null = null;
    if (dto.brandId) {
      brand = await this.brandsRepository.findOne({
        where: { id: dto.brandId },
      });
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    const template = this.productTemplatesRepository.create({
      ...dto,
      category,
      brand,
    });
    return this.productTemplatesRepository.save(template);
  }

  async findAll(
    query: GetProductTemplatesDto,
  ): Promise<PaginationResult<ProductTemplate>> {
    const { page = 1, limit = 10, search, categoryId, storeId } = query;

    // If storeId is provided, find templates that are NOT already assigned to that store
    let excludedTemplateIds: string[] = [];
    if (storeId) {
      const existingProducts = await this.productsRepository.find({
        where: {
          storeId: storeId,
          templateId: Not(null),
        },
        select: ['templateId'],
      });
      excludedTemplateIds = existingProducts
        .map((p) => p.templateId)
        .filter((id): id is string => id !== null);
    }

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    // Only add exclusion filter if we have templates to exclude
    if (storeId && excludedTemplateIds.length > 0) {
      where.id = Not(In(excludedTemplateIds));
    }

    let whereClause: any = where;
    if (search) {
      // When search is used with storeId filter, we need to apply the exclusion to both search conditions
      if (storeId && excludedTemplateIds.length > 0) {
        whereClause = [
          { ...where, id: Not(In(excludedTemplateIds)), name: ILike(`%${search}%`) },
          { ...where, id: Not(In(excludedTemplateIds)), barCode: ILike(`%${search}%`) },
        ];
      } else {
        whereClause = [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, barCode: ILike(`%${search}%`) },
        ];
      }
    }

    const [data, total] = await this.productTemplatesRepository.findAndCount({
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

  /**
   * List all product templates for Store Admin (Add Templates flow).
   * Returns full list with category and brand relations; optionally excludes
   * templates already assigned to the given store.
   */
  async findAllForStore(storeId?: string): Promise<ProductTemplate[]> {
    let where: any = {};
    if (storeId) {
      const existingProducts = await this.productsRepository.find({
        where: {
          storeId,
          templateId: Not(null),
        },
        select: ['templateId'],
      });
      const excludedTemplateIds = existingProducts
        .map((p) => p.templateId)
        .filter((id): id is string => id !== null);
      if (excludedTemplateIds.length > 0) {
        where.id = Not(In(excludedTemplateIds));
      }
    }
    return this.productTemplatesRepository.find({
      where,
      relations: ['category', 'brand'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductTemplate> {
    const template = await this.productTemplatesRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });
    if (!template) {
      throw new NotFoundException('Product template not found');
    }
    return template;
  }

  async update(
    id: string,
    dto: UpdateProductTemplateDto,
  ): Promise<ProductTemplate> {
    const template = await this.findOne(id);

    if (dto.name && dto.name !== template.name) {
      const existing = await this.productTemplatesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `A product template with the name "${dto.name}" already exists.`,
        );
      }
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        const category = await this.categoriesRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new NotFoundException('Category not found');
        }
        template.category = category;
        template.categoryId = dto.categoryId;
      } else {
        template.category = null;
        template.categoryId = null;
      }
    }

    if (dto.brandId !== undefined) {
      if (dto.brandId) {
        const brand = await this.brandsRepository.findOne({
          where: { id: dto.brandId },
        });
        if (!brand) {
          throw new NotFoundException('Brand not found');
        }
        template.brand = brand;
        template.brandId = dto.brandId;
      } else {
        template.brand = null;
        template.brandId = null;
      }
    }

    Object.assign(template, dto);
    return this.productTemplatesRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.productTemplatesRepository.remove(template);
  }

  async assignToStore(
    templateId: string,
    dto: AssignTemplateToStoreDto,
  ): Promise<Product> {
    const template = await this.findOne(templateId);
    const store = await this.storesRepository.findOne({
      where: { id: dto.storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    let category = template.category;
    if (dto.categoryId) {
      category = await this.categoriesRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    if (!category) {
      throw new BadRequestException(
        'Category is required. Set it on the template or in the request.',
      );
    }

    let brand = template.brand;
    if (dto.brandId !== undefined) {
      brand = dto.brandId
        ? await this.brandsRepository.findOne({ where: { id: dto.brandId } })
        : null;
      if (dto.brandId && !brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    const price = dto.price ?? template.price ?? 0;
    const costPrice = dto.costPrice ?? template.costPrice ?? 0;

    const existingProduct = await this.productsRepository.findOne({
      where: { name: template.name },
    });
    if (existingProduct) {
      throw new ConflictException(
        `A product with the name "${template.name}" already exists. Choose a different template or ensure product names are unique.`,
      );
    }

    const product = this.productsRepository.create({
      name: template.name,
      categoryId: category.id,
      category,
      brandId: brand?.id ?? null,
      brand,
      storeId: store.id,
      store,
      templateId: templateId,
      price,
      costPrice,
      stock: dto.stock ?? template.stock ?? null,
      barCode: dto.barCode ?? template.barCode ?? null,
      productImage: dto.productImage ?? template.productImage ?? null,
      lowStockThreshold:
        dto.lowStockThreshold ?? template.lowStockThreshold ?? null,
      supplier: dto.supplier ?? template.supplier ?? null,
      unitOfMeasure: dto.unitOfMeasure ?? template.unitOfMeasure ?? null,
    });
    return this.productsRepository.save(product);
  }

  async assignToAllStores(
    templateId: string,
    dto: AssignTemplateToAllStoresDto,
  ): Promise<Product[]> {
    const template = await this.findOne(templateId);
    const stores = await this.storesRepository.find();

    if (stores.length === 0) {
      return [];
    }

    let category = template.category;
    if (dto.categoryId) {
      category = await this.categoriesRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    if (!category) {
      throw new BadRequestException(
        'Category is required. Set it on the template or in the request.',
      );
    }

    let brand = template.brand;
    if (dto.brandId !== undefined) {
      brand = dto.brandId
        ? await this.brandsRepository.findOne({ where: { id: dto.brandId } })
        : null;
      if (dto.brandId && !brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    const price = dto.price ?? template.price ?? 0;
    const costPrice = dto.costPrice ?? template.costPrice ?? 0;

    const products: Product[] = [];
    for (const store of stores) {
      const productName = `${template.name} - ${store.name || store.id}`;
      const product = this.productsRepository.create({
        name: productName,
        categoryId: category.id,
        category,
        brandId: brand?.id ?? null,
        brand,
        storeId: store.id,
        store,
        templateId: templateId,
        price,
        costPrice,
        stock: dto.stock ?? template.stock ?? null,
        barCode: dto.barCode ?? template.barCode ?? null,
        productImage: dto.productImage ?? template.productImage ?? null,
        lowStockThreshold:
          dto.lowStockThreshold ?? template.lowStockThreshold ?? null,
        supplier: dto.supplier ?? template.supplier ?? null,
        unitOfMeasure: dto.unitOfMeasure ?? template.unitOfMeasure ?? null,
      });
      products.push(await this.productsRepository.save(product));
    }
    return products;
  }
}
