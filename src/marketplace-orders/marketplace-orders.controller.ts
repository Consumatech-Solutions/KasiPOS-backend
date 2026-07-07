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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MarketplaceOrdersService } from './marketplace-orders.service';
import { CreateMarketplaceOrderDto } from './dto/create-marketplace-order.dto';
import { UpdateMarketplaceOrderDto } from './dto/update-marketplace-order.dto';
import { GetMarketplaceOrdersDto } from './dto/get-marketplace-orders.dto';

@ApiTags('marketplace-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
@Controller('marketplace-orders')
export class MarketplaceOrdersController {
  constructor(
    private readonly marketplaceOrdersService: MarketplaceOrdersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marketplace order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateMarketplaceOrderDto, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.marketplaceOrdersService.create(dto, storeId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all marketplace orders with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() query: GetMarketplaceOrdersDto, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.marketplaceOrdersService.findAll(query, storeId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for an order by order code' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findByOrderCode(@Query('code') code: string, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.marketplaceOrdersService.findByOrderCode(code, storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a marketplace order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.marketplaceOrdersService.findOne(id, storeId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update marketplace order status' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMarketplaceOrderDto,
    @Request() req: any,
  ) {
    const storeId = req.user.storeId;
    return this.marketplaceOrdersService.updateStatus(id, dto, storeId);
  }
}
