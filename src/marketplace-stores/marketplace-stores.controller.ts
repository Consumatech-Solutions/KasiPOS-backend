import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceStoresService } from './marketplace-stores.service';
import { CreateMarketplaceStoreDto } from './dto/create-marketplace-store.dto';
import { UpdateMarketplaceStoreDto } from './dto/update-marketplace-store.dto';

@ApiTags('marketplace-stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace-stores')
export class MarketplaceStoresController {
  constructor(
    private readonly marketplaceStoresService: MarketplaceStoresService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marketplace store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateMarketplaceStoreDto) {
    return this.marketplaceStoresService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all marketplace stores' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter only active stores',
  })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const activeOnlyBool = activeOnly === 'true';
    return this.marketplaceStoresService.findAll(activeOnlyBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a marketplace store by ID' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findOne(@Param('id') id: string) {
    return this.marketplaceStoresService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a marketplace store by code' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findByCode(@Param('code') code: string) {
    return this.marketplaceStoresService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a marketplace store' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMarketplaceStoreDto) {
    return this.marketplaceStoresService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a marketplace store' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  remove(@Param('id') id: string) {
    return this.marketplaceStoresService.remove(id);
  }
}
