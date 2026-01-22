import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { GetPurchaseOrdersDto } from './dto/get-purchase-orders.dto';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a purchase order',
    description: 'Create a new purchase order. Order code is generated automatically. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() dto: CreatePurchaseOrderDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.purchaseOrdersService.create(dto, storeId);
  }

  @Get()
  @ApiOperation({
    summary: 'List purchase orders',
    description: 'Retrieve a paginated list of purchase orders for the current store. Requires authentication.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Purchase orders retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: GetPurchaseOrdersDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.purchaseOrdersService.findAll(query, storeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get purchase order by ID',
    description: 'Retrieve a specific purchase order by its ID. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Purchase order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.purchaseOrdersService.findOne(id, storeId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update purchase order status',
    description: 'Update the status of a purchase order (e.g., mark as completed or cancelled). Does NOT automatically update stock. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Purchase order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Request() req,
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.purchaseOrdersService.updateStatus(id, dto, storeId);
  }
}
