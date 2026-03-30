import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTemplate } from './entities/category-template.entity';
import { CreateCategoryTemplateDto } from './dto/create-category-template.dto';
import { UpdateCategoryTemplateDto } from './dto/update-category-template.dto';
import { PaginationResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoryTemplatesService {
  constructor(
    @InjectRepository(CategoryTemplate)
    private categoryTemplatesRepository: Repository<CategoryTemplate>,
  ) {}

  async create(dto: CreateCategoryTemplateDto): Promise<CategoryTemplate> {
    const existing = await this.categoryTemplatesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `A category template with the name "${dto.name}" already exists.`,
      );
    }
    const template = this.categoryTemplatesRepository.create(dto);
    return this.categoryTemplatesRepository.save(template);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<CategoryTemplate>> {
    const [data, total] = await this.categoryTemplatesRepository.findAndCount({
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

  async findOne(id: string): Promise<CategoryTemplate> {
    const template = await this.categoryTemplatesRepository.findOne({
      where: { id },
      relations: ['productTemplates'],
    });
    if (!template) {
      throw new NotFoundException('Category template not found');
    }
    return template;
  }

  async update(
    id: string,
    dto: UpdateCategoryTemplateDto,
  ): Promise<CategoryTemplate> {
    const template = await this.findOne(id);
    if (dto.name && dto.name !== template.name) {
      const existing = await this.categoryTemplatesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `A category template with the name "${dto.name}" already exists.`,
        );
      }
    }
    Object.assign(template, dto);
    return this.categoryTemplatesRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.categoryTemplatesRepository.softRemove(template);
  }
}
