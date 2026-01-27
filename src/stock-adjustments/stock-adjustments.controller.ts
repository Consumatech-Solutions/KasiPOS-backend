import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { GetStockAdjustmentsDto } from './dto/get-stock-adjustments.dto';

@ApiTags('Stock Adjustments')
@Controller('stock-adjustments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockAdjustmentsController {
  constructor(private readonly stockAdjustmentsService: StockAdjustmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a stock adjustment',
    description: 'Create a stock adjustment and update product stock atomically. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock adjustment created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(@Body() dto: CreateStockAdjustmentDto, @Request() req) {
    // Get storeId from user context
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.stockAdjustmentsService.create(dto, storeId);
  }

  @Get()
  @ApiOperation({
    summary: 'List stock adjustments',
    description: 'Retrieve a paginated list of stock adjustments. Requires authentication.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjustments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: GetStockAdjustmentsDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.stockAdjustmentsService.findAll(query, storeId);
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get stock adjustment history for a product',
    description: 'Retrieve all stock adjustments for a specific product. Requires authentication.',
  })
  @ApiParam({ name: 'productId', type: String, description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjustments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findByProduct(@Param('productId') productId: string, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.stockAdjustmentsService.findByProduct(productId, storeId);
  }
}
