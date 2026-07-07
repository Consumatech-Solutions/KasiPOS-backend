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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { GetBrandsDto } from './dto/get-brands.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Brands')
@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new brand',
    description: 'Create a new brand. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Nike',
        logoUrl: 'https://example.com/nike-logo.png',
        contactName: 'John Smith',
        contactEmail: 'contact@nike.com',
        contactPhone: '0812345678',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all brands',
    description:
      'Retrieve a paginated list of all brands. Supports search by name. Requires authentication.',
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
    description: 'Search by brand name',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Nike',
            logoUrl: 'https://example.com/nike-logo.png',
            contactName: 'John Smith',
            contactEmail: 'contact@nike.com',
            contactPhone: '0812345678',
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
  async findAll(@Query() query: GetBrandsDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get brand by ID',
    description:
      'Retrieve a specific brand by its unique ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Brand UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Nike',
        logoUrl: 'https://example.com/nike-logo.png',
        contactName: 'John Smith',
        contactEmail: 'contact@nike.com',
        contactPhone: '0812345678',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update brand',
    description: 'Update brand information. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Brand UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Nike Updated',
        logoUrl: 'https://example.com/nike-logo-new.png',
        contactName: 'Jane Doe',
        contactEmail: 'new.contact@nike.com',
        contactPhone: '0823456789',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete brand',
    description: 'Delete a brand by its ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Brand UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand deleted successfully',
    schema: {
      example: {
        message: 'Brand deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async remove(@Param('id') id: string) {
    await this.brandsService.remove(id);
    return { message: 'Brand deleted successfully' };
  }
}
