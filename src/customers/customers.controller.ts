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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetCustomersDto } from './dto/get-customers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new customer',
    description:
      'Create a new customer. Store admin: customer is linked to their store. Admin: may pass storeId in body.',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe',
        contact: '+1234567890',
        loyaltyPoints: 0,
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
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Body('_tempId') tempIdFromBody?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? createCustomerDto.storeId;
    return this.customersService.create(
      createCustomerDto,
      tempIdFromBody,
      storeId,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all customers',
    description:
      'Retrieve a paginated list of all customers. Supports search by name or contact. Requires authentication.',
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
    description: 'Search by customer name or contact',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'John Doe',
            contact: '+1234567890',
            loyaltyPoints: 0,
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
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Filter by store (admin); store admin sees only their store',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(
    @Query() query: GetCustomersDto,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery ?? query.storeId;
    return this.customersService.findAll(query, storeId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get customer by ID',
    description:
      'Retrieve a specific customer by its unique ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Customer UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe',
        contact: '+1234567890',
        loyaltyPoints: 0,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin); store admin sees only their store',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @Param('id') id: string,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    return this.customersService.findOne(id, storeId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update customer',
    description: 'Update customer information. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Customer UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe Updated',
        contact: '+1234567890',
        loyaltyPoints: 100,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    return this.customersService.update(id, updateCustomerDto, storeId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete customer',
    description: 'Delete a customer by its ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Customer UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
    schema: {
      example: {
        message: 'Customer deleted successfully',
      },
    },
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    description: 'Scope to store (admin)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(
    @Param('id') id: string,
    @Query('storeId') storeIdQuery?: string,
    @Request() req?: any,
  ) {
    const storeId = req?.user?.storeId ?? storeIdQuery;
    await this.customersService.remove(id, storeId);
    return { message: 'Customer deleted successfully' };
  }
}
