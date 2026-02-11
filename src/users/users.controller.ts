import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieve a list of all users, optionally filtered by store ID. Requires authentication.'
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: Number,
    description: 'Filter users by store ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            email: 'admin@kasipos.demo',
            name: 'John Doe',
            role: 'staff',
            storeId: 1,
            isActive: true,
            createdAt: '2026-01-20T08:00:00.000Z',
            updatedAt: '2026-01-20T08:00:00.000Z'
          }
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@Query() paginationDto: PaginationDto, @Query('storeId') storeId?: number) {
    return this.usersService.findAll(paginationDto.page, paginationDto.limit, storeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their unique ID. Requires authentication.'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID'
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        email: 'admin@kasipos.demo',
        name: 'John Doe',
        role: 'staff',
        storeId: 1,
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user (e.g. staff member). Requires authentication.'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: 'uuid-here',
        email: 'admin@kasipos.demo',
        name: 'John Doe',
        role: 'staff',
        storeId: 1,
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information. Requires authentication.'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        email: 'admin@kasipos.demo',
        name: 'John Doe Updated',
        role: 'admin',
        storeId: 1,
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Soft delete a user by setting their isActive status to false. Requires authentication.'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID'
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    schema: {
      example: {
        message: 'User deactivated successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete(id);
    return { message: 'User deactivated successfully' };
  }
}
