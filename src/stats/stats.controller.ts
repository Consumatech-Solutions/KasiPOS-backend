import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService, AllStatsDto } from './stats.service';
import { GetStatsDto } from './dto/get-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all stats (admin only)',
    description:
      'Returns aggregated stats. Optionally filter by period (today, week, month, year) or custom date range (startDate, endDate). When filtered, all counts and sums are restricted to records created within the range.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description:
      'Filter stats by period (today, this week, this month, this year)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description:
      'Custom range start (ISO 8601). Use with endDate; overrides period.',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description:
      'Custom range end (ISO 8601). Use with startDate; overrides period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    schema: {
      example: {
        stores: { total: 10, active: 8, inactive: 2 },
        clients: { total: 150 },
        transactions: { number: 1200, total: 45000.5 },
        campaigns: { total: 5, active: 3, inactive: 2 },
        pendingActions: {
          number: 4,
          items: [
            { type: 'purchaseOrder', id: 'uuid', data: {} },
            { type: 'marketplaceOrder', id: 'uuid', data: {} },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAll(@Query() filter: GetStatsDto): Promise<AllStatsDto> {
    return this.statsService.getAll(filter);
  }
}
