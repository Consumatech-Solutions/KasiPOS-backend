import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Create a new product category. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all categories',
    description: 'Retrieve a paginated list of all categories. Requires authentication.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Electronics',
            createdAt: '2026-01-20T08:00:00.000Z',
            updatedAt: '2026-01-20T08:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.categoriesService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieve a specific category by its unique ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Update category information. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics Updated',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Delete a category by its ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      example: {
        message: 'Category deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return { message: 'Category deleted successfully' };
  }
}
