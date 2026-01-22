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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GetVouchersDto } from './dto/get-vouchers.dto';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';

@ApiTags('Vouchers')
@Controller('vouchers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a voucher',
    description: 'Create a new discount voucher. Code must be unique per store. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Voucher created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 409, description: 'Voucher code already exists for this store' })
  async create(@Body() dto: CreateVoucherDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.create(dto, storeId);
  }

  @Get()
  @ApiOperation({
    summary: 'List vouchers',
    description: 'Retrieve a paginated list of vouchers for the current store. Requires authentication.',
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
    description: 'Items per page (default: 10, max: 10)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Vouchers retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() query: GetVouchersDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.findAll(query, storeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get voucher by ID',
    description: 'Retrieve a specific voucher by its ID. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Voucher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Voucher retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.findOne(id, storeId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update voucher',
    description: 'Update a voucher. Code cannot be changed after creation. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Voucher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Voucher updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 400, description: 'Cannot change voucher code' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
    @Request() req,
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.update(id, dto, storeId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete voucher',
    description: 'Delete a voucher. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Voucher UUID' })
  @ApiResponse({
    status: 200,
    description: 'Voucher deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async remove(@Param('id') id: string, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.remove(id, storeId);
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate voucher for redemption',
    description:
      'Validate a voucher code for redemption. Checks expiration, usage limits, and minimum purchase. Returns discount amount if valid. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Voucher validation result',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async validate(@Body() dto: ValidateVoucherDto, @Request() req) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new Error('User does not have an associated store');
    }
    return this.vouchersService.validate(dto, storeId);
  }
}
