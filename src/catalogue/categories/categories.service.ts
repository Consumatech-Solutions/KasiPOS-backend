import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto, storeId: string): Promise<Category> {
    const existing = await this.categoriesRepository.findOne({
      where: { storeId, name: createCategoryDto.name },
    });
    if (existing) {
      throw new ConflictException(`A category with the name "${createCategoryDto.name}" already exists in this store.`);
    }

    const category = this.categoriesRepository.create({
      name: createCategoryDto.name,
      storeId,
    });
    return this.categoriesRepository.save(category);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    storeId?: string,
  ): Promise<PaginationResult<Category>> {
    const where: { storeId?: string } = {};
    if (storeId) {
      where.storeId = storeId;
    }
    const [data, total] = await this.categoriesRepository.findAndCount({
      where,
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

  async findOne(id: string, storeId?: string): Promise<Category> {
    const where: { id: string; storeId?: string } = { id };
    if (storeId) {
      where.storeId = storeId;
    }
    const category = await this.categoriesRepository.findOne({
      where,
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    storeId?: string,
  ): Promise<Category> {
    const category = await this.findOne(id, storeId);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoriesRepository.findOne({
        where: { storeId: category.storeId, name: updateCategoryDto.name },
      });
      if (existing) {
        throw new ConflictException(`A category with the name "${updateCategoryDto.name}" already exists in this store.`);
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string, storeId?: string): Promise<void> {
    const category = await this.findOne(id, storeId);
    await this.categoriesRepository.remove(category);
  }
}
