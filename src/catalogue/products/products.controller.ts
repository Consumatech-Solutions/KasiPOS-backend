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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminCreateProductDto } from './dto/admin-create-product.dto';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { AddTemplateDto } from './dto/add-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ==================== Non-Admin Routes ====================

  @Post()
  @ApiOperation({
    summary: 'Create a new product (for non-admin users)',
    description: 'Create a new product. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Laptop',
        categoryId: 'category-uuid',
        price: 999.99,
        costPrice: 700.0,
        stock: 10,
        barCode: '1234567890123',
        productImage: 'https://example.com/image.jpg',
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
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user.storeId);
  }

  @Post('add-template')
  @ApiOperation({
    summary: 'Add products and categories from templates to a store',
    description:
      'For each item: ensure the category template exists as a category in the store, then create products from the given product template IDs in that category. Store admin: uses their store. Admin: pass storeId in body.',
  })
  @ApiResponse({
    status: 201,
    description: 'Products created from templates',
    schema: {
      example: [
        {
          id: 'uuid-here',
          name: 'Template Name - My Store',
          categoryId: 'category-uuid',
          storeId: 'store-uuid',
          price: 99.99,
          costPrice: 50.0,
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Store ID required (body.storeId for admin or store admin context)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category template or product template not found' })
  @ApiResponse({ status: 409, description: 'Product with this name already exists in store' })
  async addTemplate(@Request() req: any, @Body() dto: AddTemplateDto) {
    const storeId = dto.storeId ?? req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store ID is required (set storeId in body for admin or use store admin context).');
    }
    return this.productsService.addTemplates(storeId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all products',
    description:
      'Retrieve a paginated list of all products. Requires authentication.',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search by product name or barcode',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Laptop',
            category: {
              id: 'category-uuid',
              name: 'Electronics',
            },
            brand: {
              id: 'brand-uuid',
              name: 'Dell',
            },
            price: 999.99,
            costPrice: 700.0,
            stock: 10,
            barCode: '1234567890123',
            productImage: 'https://example.com/image.jpg',
            supplier: 'Tech Distributors',
            unitOfMeasure: 'piece',
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
  async findAll(@Query() query: GetProductsDto, @Request() req: any) {
    return this.productsService.findAll(query, req.user.storeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieve a specific product by its unique ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Laptop',
        category: {
          id: 'category-uuid',
          name: 'Electronics',
        },
        brand: {
          id: 'brand-uuid',
          name: 'Dell',
        },
        price: 999.99,
        costPrice: 700.0,
        stock: 10,
        barCode: '1234567890123',
        productImage: 'https://example.com/image.jpg',
        supplier: 'Tech Distributors',
        unitOfMeasure: 'piece',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product (for non-admin users)',
    description: 'Update product information. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Laptop Updated',
        category: {
          id: 'category-uuid',
          name: 'Electronics',
        },
        price: 1099.99,
        costPrice: 800.0,
        stock: 15,
        barCode: '1234567890123',
        productImage: 'https://example.com/image.jpg',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete a product by its ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: 'Product deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }

  // ==================== Admin-Only Routes ====================

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new product (admin only)',
    description: 'Create a new product with admin fields like brand, supplier, and unit of measure. Requires admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully by admin',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Laptop Pro 15',
        barCode: '1234567890123',
        category: {
          id: 'category-uuid',
          name: 'Electronics',
        },
        brand: {
          id: 'brand-uuid',
          name: 'Dell',
        },
        supplier: 'Tech Distributors Ltd',
        unitOfMeasure: 'piece',
        price: 0,
        costPrice: 0,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Category or Brand not found' })
  @ApiResponse({ status: 409, description: 'Product with this name already exists' })
  async adminCreate(@Body() adminCreateProductDto: AdminCreateProductDto) {
    return this.productsService.adminCreate(adminCreateProductDto);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all products (admin only)',
    description: 'Retrieve a paginated list of all products with full admin details. Requires admin role.',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search by product name, barcode, or supplier',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Laptop Pro 15',
            barCode: '1234567890123',
            category: {
              id: 'category-uuid',
              name: 'Electronics',
            },
            brand: {
              id: 'brand-uuid',
              name: 'Dell',
            },
            supplier: 'Tech Distributors Ltd',
            unitOfMeasure: 'piece',
            price: 999.99,
            costPrice: 700.0,
            stock: 10,
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async adminFindAll(@Query() query: GetProductsDto) {
    return this.productsService.adminFindAll(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get product by ID (admin only)',
    description: 'Retrieve a specific product with all admin fields. Requires admin role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async adminFindOne(@Param('id') id: string) {
    return this.productsService.adminFindOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update product (admin only)',
    description: 'Update product with admin fields. Requires admin role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product, Category, or Brand not found' })
  @ApiResponse({ status: 409, description: 'Product with this name already exists' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() adminUpdateProductDto: AdminUpdateProductDto,
  ) {
    return this.productsService.adminUpdate(id, adminUpdateProductDto);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete product (admin only)',
    description: 'Delete a product by its ID. Requires admin role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: 'Product deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async adminRemove(@Param('id') id: string) {
    await this.productsService.adminRemove(id);
    return { message: 'Product deleted successfully' };
  }
}
