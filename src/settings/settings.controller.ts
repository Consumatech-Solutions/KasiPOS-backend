import {
  Controller,
  Get,
  Patch,
  Body,
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
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'Get my store settings (store admin)',
    description:
      'Returns settings for the store assigned to the authenticated store admin. Defaults are created if no settings exist (e.g. vatIncludedInPrice: true).',
  })
  @ApiResponse({
    status: 200,
    description: 'Store settings',
    schema: {
      example: {
        storeId: 'uuid-here',
        vatIncludedInPrice: true,
        currency: 'USD',
        cdfUsdExRate: null,
        zarUsdExRate: null,
        updatedAt: '2026-02-20T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User has no store assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Store admin only' })
  async getSettings(@Request() req: any) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.settingsService.getForStore(storeId);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE_ADMIN)
  @ApiOperation({
    summary: 'Update my store settings (store admin)',
    description:
      'Update settings for the store assigned to the authenticated store admin. Only provided fields are updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated',
    schema: {
      example: {
        storeId: 'uuid-here',
        vatIncludedInPrice: false,
        currency: 'CDF',
        cdfUsdExRate: 2850.5,
        zarUsdExRate: 18.25,
        updatedAt: '2026-02-20T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User has no store assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Store admin only' })
  async updateSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException('Store admin must be linked to a store');
    }
    return this.settingsService.updateForStore(storeId, dto);
  }
}
