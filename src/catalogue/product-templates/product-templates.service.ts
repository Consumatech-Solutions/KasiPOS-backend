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
import { CategoryTemplate } from '../category-templates/entities/category-template.entity';
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
    @InjectRepository(CategoryTemplate)
    private categoryTemplatesRepository: Repository<CategoryTemplate>,
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

    let categoryTemplate: CategoryTemplate | null = null;
    if (dto.categoryTemplateId) {
      categoryTemplate = await this.categoryTemplatesRepository.findOne({
        where: { id: dto.categoryTemplateId },
      });
      if (!categoryTemplate) {
        throw new NotFoundException('Category template not found');
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
      categoryTemplate,
      brand,
    });
    return this.productTemplatesRepository.save(template);
  }

  async findAll(
    query: GetProductTemplatesDto,
  ): Promise<PaginationResult<ProductTemplate>> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryTemplateId,
      storeId,
      sortByName,
    } = query;

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
    if (categoryTemplateId) {
      where.categoryTemplateId = categoryTemplateId;
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
          {
            ...where,
            id: Not(In(excludedTemplateIds)),
            name: ILike(`%${search}%`),
          },
          {
            ...where,
            id: Not(In(excludedTemplateIds)),
            barCode: ILike(`%${search}%`),
          },
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
      relations: ['categoryTemplate', 'brand'],
      order: sortByName
        ? { name: sortByName.toUpperCase() as 'ASC' | 'DESC' }
        : { createdAt: 'DESC' },
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
    const where: any = {};
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
      relations: ['categoryTemplate', 'brand'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductTemplate> {
    const template = await this.productTemplatesRepository.findOne({
      where: { id },
      relations: ['categoryTemplate', 'brand'],
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

    if (dto.categoryTemplateId !== undefined) {
      if (dto.categoryTemplateId) {
        const categoryTemplate = await this.categoryTemplatesRepository.findOne(
          {
            where: { id: dto.categoryTemplateId },
          },
        );
        if (!categoryTemplate) {
          throw new NotFoundException('Category template not found');
        }
        template.categoryTemplate = categoryTemplate;
        template.categoryTemplateId = dto.categoryTemplateId;
      } else {
        template.categoryTemplate = null;
        template.categoryTemplateId = null;
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
    await this.productTemplatesRepository.softRemove(template);
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

    let category: Category;
    if (dto.categoryId) {
      const c = await this.categoriesRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!c || c.storeId !== store.id) {
        throw new NotFoundException(
          'Category not found or does not belong to this store',
        );
      }
      category = c;
    } else if (template.categoryTemplate) {
      let c = await this.categoriesRepository.findOne({
        where: { storeId: store.id, name: template.categoryTemplate.name },
      });
      if (!c) {
        c = this.categoriesRepository.create({
          name: template.categoryTemplate.name,
          storeId: store.id,
          store,
        });
        c = await this.categoriesRepository.save(c);
      }
      category = c;
    } else {
      throw new BadRequestException(
        'Category is required. Set category template on the template or provide categoryId in the request.',
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

    const productName = `${template.name} - ${store.name || store.id}`;
    const existingProduct = await this.productsRepository.findOne({
      where: { storeId: store.id, name: productName },
    });
    if (existingProduct) {
      throw new ConflictException(
        `A product with the name "${productName}" already exists in this store. Choose a different template or ensure product names are unique.`,
      );
    }

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

    if (!template.categoryTemplate) {
      throw new BadRequestException(
        'Category template is required on the product template for assign to all stores.',
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
      let category = await this.categoriesRepository.findOne({
        where: { storeId: store.id, name: template.categoryTemplate!.name },
      });
      if (!category) {
        category = this.categoriesRepository.create({
          name: template.categoryTemplate!.name,
          storeId: store.id,
          store,
        });
        category = await this.categoriesRepository.save(category);
      }
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
