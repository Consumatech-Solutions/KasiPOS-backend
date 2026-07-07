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
import { ParcelsService } from './parcels.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { GetParcelsDto } from './dto/get-parcels.dto';
import { ReceiveParcelDto } from './dto/receive-parcel.dto';
import { CollectParcelDto } from './dto/collect-parcel.dto';

@ApiTags('parcels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new parcel' })
  @ApiResponse({ status: 201, description: 'Parcel created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateParcelDto, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.parcelsService.create(dto, storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parcels with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Parcels retrieved successfully' })
  findAll(@Query() query: GetParcelsDto, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.parcelsService.findAll(query, storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parcel by ID' })
  @ApiResponse({ status: 200, description: 'Parcel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.parcelsService.findOne(id, storeId);
  }

  @Get('collection-code/:code')
  @ApiOperation({ summary: 'Get a parcel by collection code' })
  @ApiResponse({ status: 200, description: 'Parcel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  findByCollectionCode(@Param('code') code: string, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.parcelsService.findByCollectionCode(code, storeId);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Mark a parcel as received' })
  @ApiResponse({ status: 200, description: 'Parcel received successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  @ApiResponse({ status: 400, description: 'Invalid parcel status' })
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveParcelDto,
    @Request() req: any,
  ) {
    const storeId = req.user.storeId;
    return this.parcelsService.receive(id, dto, storeId);
  }

  @Post(':id/collect')
  @ApiOperation({ summary: 'Mark a parcel as collected' })
  @ApiResponse({ status: 200, description: 'Parcel collected successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid parcel status or collection code',
  })
  collect(
    @Param('id') id: string,
    @Body() dto: CollectParcelDto,
    @Request() req: any,
  ) {
    const storeId = req.user.storeId;
    return this.parcelsService.collect(id, dto, storeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a parcel' })
  @ApiResponse({ status: 200, description: 'Parcel updated successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateParcelDto,
    @Request() req: any,
  ) {
    const storeId = req.user.storeId;
    return this.parcelsService.update(id, dto, storeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parcel' })
  @ApiResponse({ status: 200, description: 'Parcel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    const storeId = req.user.storeId;
    return this.parcelsService.remove(id, storeId);
  }
}
