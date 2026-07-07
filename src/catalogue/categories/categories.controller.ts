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
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'Create a new product category for a store. Store admin uses their store; admin may pass storeId.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics',
        storeId: 'store-uuid',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Store ID required' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: any,
  ) {
    const storeId = createCategoryDto.storeId ?? req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException(
        'Store ID is required (set in body for admin or use store admin context).',
      );
    }
    return this.categoriesService.create(createCategoryDto, storeId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List categories',
    description:
      'Paginated list. Store admin sees their store only; admin may filter by storeId query.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Filter by store (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Electronics',
            storeId: 'store-uuid',
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    return this.categoriesService.findAll(
      paginationDto.page,
      paginationDto.limit,
      storeId,
      paginationDto.updatedAtAfter,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Store admin: category must belong to their store. Admin: any category.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics',
        storeId: 'store-uuid',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id') id: string,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    return this.categoriesService.findOne(id, storeId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update category',
    description: 'Store admin: category must belong to their store.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Electronics Updated',
        storeId: 'store-uuid',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    return this.categoriesService.update(id, updateCategoryDto, storeId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete category',
    description: 'Store admin: category must belong to their store.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category UUID',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin)',
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @Param('id') id: string,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    await this.categoriesService.remove(id, storeId);
    return { message: 'Category deleted successfully' };
  }
}
