import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuditAction } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all audit logs (admin only)',
    description:
      'Retrieve a paginated list of all audit logs. Supports filtering by user, action, entity, and date range.',
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
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditAction,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description: 'Filter by entity name',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter from date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter until date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            timestamp: '2026-01-20T08:00:00.000Z',
            user: {
              id: 'user-uuid',
              name: 'John Doe',
              email: 'john@example.com',
            },
            action: 'CREATE',
            entity: 'products',
            entityId: 'product-uuid',
            changes: { name: 'New Product', price: 100 },
            endpoint: '/products',
            method: 'POST',
            ipAddress: '192.168.1.1',
            statusCode: 201,
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll(@Query() query: GetAuditLogsDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent audit logs (admin only)',
    description:
      'Retrieve the most recent audit logs. Same as list with default limit.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent logs (default: 50, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent audit logs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findRecent(@Query('limit') limit?: number) {
    return this.auditLogsService.findAll({
      page: 1,
      limit: Math.min(limit || 50, 100),
    });
  }

  @Get('entity/:entity/:entityId')
  @ApiOperation({
    summary: 'Get audit logs for a specific entity (admin only)',
    description: 'Retrieve all audit logs related to a specific entity.',
  })
  @ApiParam({
    name: 'entity',
    type: String,
    description: 'Entity name (e.g., products, users)',
  })
  @ApiParam({ name: 'entityId', type: String, description: 'Entity UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogsService.findByEntity(entity, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get audit logs for a specific user (admin only)',
    description:
      'Retrieve all audit logs for actions performed by a specific user.',
  })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of logs to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogsService.findByUser(userId, limit || 50);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID (admin only)',
    description: 'Retrieve a specific audit log entry by its ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Audit log UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.findOne(id);
  }
}
