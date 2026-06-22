import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_ADMIN)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List in-app notifications for the current store admin',
    description:
      'Returns paginated notifications for the authenticated user. Includes credit payment reminders.',
  })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findAll(@Query() query: GetNotificationsDto, @Request() req: any) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.notificationsService.findForUser(req.user.id, storeId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count',
    schema: { example: { count: 3 } },
  })
  async unreadCount(@Request() req: any) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    const count = await this.notificationsService.countUnread(
      req.user.id,
      storeId,
    );
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllRead(@Request() req: any) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.notificationsService.markAllAsRead(req.user.id, storeId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String, description: 'Notification UUID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.notificationsService.markAsRead(req.user.id, id, storeId);
  }
}
