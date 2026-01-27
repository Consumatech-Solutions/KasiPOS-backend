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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetCustomersDto } from './dto/get-customers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new customer',
    description: 'Create a new customer. Requires authentication.',
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
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(@Query() query: GetCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return { message: 'Customer deleted successfully' };
  }
}
