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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ClientType } from './entities/client.entity';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description: 'Create a new client. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe',
        type: 'individual',
        idNumber: '9001015800080',
        physicalAddress: '123 Main Street, Johannesburg, 2000',
        contactNumber: '0812345678',
        email: 'john.doe@example.com',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all clients',
    description:
      'Retrieve a paginated list of all clients. Supports search and filtering by type. Requires authentication.',
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
    description: 'Search by client name, ID number, contact number, or email',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ClientType,
    description: 'Filter by client type',
  })
  @ApiResponse({
    status: 200,
    description: 'Clients retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'John Doe',
            type: 'individual',
            idNumber: '9001015800080',
            physicalAddress: '123 Main Street, Johannesburg, 2000',
            contactNumber: '0812345678',
            email: 'john.doe@example.com',
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
  async findAll(@Query() query: GetClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get client by ID',
    description:
      'Retrieve a specific client by its unique ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Client retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe',
        type: 'individual',
        idNumber: '9001015800080',
        physicalAddress: '123 Main Street, Johannesburg, 2000',
        contactNumber: '0812345678',
        email: 'john.doe@example.com',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update client',
    description: 'Update client information. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'John Doe Updated',
        type: 'business',
        idNumber: '9001015800080',
        physicalAddress: '456 New Street, Cape Town, 8000',
        contactNumber: '0823456789',
        email: 'john.updated@example.com',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete client',
    description: 'Delete a client by its ID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Client deleted successfully',
    schema: {
      example: {
        message: 'Client deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id') id: string) {
    await this.clientsService.remove(id);
    return { message: 'Client deleted successfully' };
  }
}
