import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DashboardStatsService } from './dashboard-stats.service';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

@ApiTags('Dashboard Stats')
@Controller('dashboard-stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN)
@ApiBearerAuth()
export class DashboardStatsController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get store dashboard stats (store admin)',
    description:
      'Returns aggregated store dashboard metrics including sales totals, customer counts, outstanding credit, recent sales, and a 7-day sales trend. All monetary aggregates are computed in SQL. customersOnCredit supports page/limit pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'User has no store assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Store admin only' })
  async getDashboardStats(
    @Query() query: GetDashboardStatsDto,
    @Request() req: any,
  ): Promise<DashboardStatsResponseDto> {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.dashboardStatsService.getDashboardStats(storeId, query);
  }
}
