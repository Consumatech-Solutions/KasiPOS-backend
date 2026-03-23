import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AdminCreateStoreDto } from './dto/admin-create-store.dto';
import { AdminUpdateStoreDto } from './dto/admin-update-store.dto';
import { AssignStoreDto } from './dto/assign-store.dto';
import { RoleTransferDto } from './dto/role-transfer.dto';
import { GetStoresDto } from './dto/get-stores.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StoreStatus } from './entities/store.entity';

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    // ==================== Non-Admin Routes ====================

    @Post()
    @ApiOperation({ summary: 'Create a new store (for non-admin users)' })
    @ApiResponse({ status: 201, description: 'The store has been successfully created.' })
    create(@Body() createStoreDto: CreateStoreDto, @Request() req) {
        return this.storesService.create(createStoreDto, req.user.id);
    }

    @Get('my-store')
    @ApiOperation({ summary: 'Get current user store' })
    @ApiResponse({ status: 200, description: 'Return the store associated with the user.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    async getMyStore(@Request() req) {
        const store = await this.storesService.findByUser(req.user.id);
        if (!store) {
            throw new NotFoundException('Store not found for this user');
        }
        return store;
    }

    @Post('role-transfer')
    @UseGuards(RolesGuard)
    @Roles(UserRole.STORE_ADMIN)
    @ApiOperation({
        summary: 'Transfer store ownership to a staff user (store admin only)',
        description:
            'The current store owner becomes staff (if oldStoreAdminState is "staff user") or is deactivated and unlinked from the store (if "deleted"). The designated staff user becomes store admin and store owner.',
    })
    @ApiResponse({ status: 200, description: 'Ownership transferred' })
    @ApiResponse({ status: 400, description: 'Invalid staff user or state' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — not store owner or no store' })
    @ApiResponse({ status: 404, description: 'Store or user not found' })
    async roleTransfer(@Request() req: any, @Body() dto: RoleTransferDto) {
        const storeId = req.user?.storeId;
        if (!storeId) {
            throw new BadRequestException('Store admin must be linked to a store');
        }
        return this.storesService.roleTransfer(req.user.id, storeId, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get store by id' })
    @ApiParam({ name: 'id', type: String, description: 'Store UUID' })
    @ApiResponse({ status: 200, description: 'Return the store.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    findOne(@Param('id') id: string) {
        return this.storesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a store (for non-admin users)' })
    @ApiParam({ name: 'id', type: String, description: 'Store UUID' })
    @ApiResponse({ status: 200, description: 'The store has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
        return this.storesService.update(id, updateStoreDto);
    }

    // ==================== Admin-Only Routes ====================

    @Post('admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new store (admin only)' })
    @ApiResponse({
        status: 201,
        description: 'The store has been successfully created by admin.',
        schema: {
            example: {
                id: 'uuid-here',
                name: 'My Store',
                vatNumber: '123456789',
                ownerId: 'uuid-here',
                clientId: 'uuid-here',
                contactNumber: '0812345678',
                initialStatus: 'active',
                address: '123 Main Street, Johannesburg',
                latitude: '-26.2041',
                longitude: '28.0473',
                enabledModules: {
                    groupbuying: false,
                    marketplace: false,
                    boph: false,
                    campaigns: false
                },
                tradingHours: {
                    monday: { start: '08:00', end: '17:00' },
                    tuesday: { start: '08:00', end: '17:00' },
                    wednesday: { start: '08:00', end: '17:00' },
                    thursday: { start: '08:00', end: '17:00' },
                    friday: { start: '08:00', end: '17:00' },
                    saturday: { start: '09:00', end: '13:00' },
                    sunday: { start: null, end: null }
                },
                createdAt: '2026-01-20T08:00:00.000Z',
                updatedAt: '2026-01-20T08:00:00.000Z'
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Owner must be an admin user.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    @ApiResponse({ status: 404, description: 'Owner user not found.' })
    adminCreate(@Body() adminCreateStoreDto: AdminCreateStoreDto) {
        return this.storesService.adminCreate(adminCreateStoreDto);
    }

    @Post('admin/assign-store')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Assign a store to a new store admin (admin only)' })
    @ApiResponse({ status: 201, description: 'Store assigned; store admin receives SMS with temporary password and reset link.' })
    @ApiResponse({ status: 400, description: 'Store already has an owner or user with this phone exists.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    assignStore(@Body() assignStoreDto: AssignStoreDto) {
        return this.storesService.assignStore(assignStoreDto);
    }

    @Get('admin/list')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all stores (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by store name or address' })
    @ApiQuery({ name: 'status', required: false, enum: StoreStatus, description: 'Filter by initial status' })
    @ApiResponse({
        status: 200,
        description: 'Stores retrieved successfully.',
        schema: {
            example: {
                data: [
                    {
                        id: 'uuid-here',
                        name: 'My Store',
                        vatNumber: '123456789',
                        ownerId: 'uuid-here',
                        clientId: 'uuid-here',
                        contactNumber: '0812345678',
                        initialStatus: 'active',
                        address: '123 Main Street, Johannesburg',
                        latitude: '-26.2041',
                        longitude: '28.0473',
                        enabledModules: {
                            groupbuying: false,
                            marketplace: false,
                            boph: false,
                            campaigns: false
                        },
                        client: {
                            id: 'uuid-here',
                            name: 'Client Name'
                        },
                        createdAt: '2026-01-20T08:00:00.000Z',
                        updatedAt: '2026-01-20T08:00:00.000Z'
                    }
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    adminFindAll(@Query() query: GetStoresDto) {
        return this.storesService.adminFindAll(query);
    }

    @Get('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get store by id (admin only)' })
    @ApiParam({ name: 'id', type: String, description: 'Store UUID' })
    @ApiResponse({ status: 200, description: 'Return the store with all admin fields.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    adminFindOne(@Param('id') id: string) {
        return this.storesService.adminFindOne(id);
    }

    @Patch('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a store (admin only)' })
    @ApiParam({ name: 'id', type: String, description: 'Store UUID' })
    @ApiResponse({ status: 200, description: 'The store has been successfully updated.' })
    @ApiResponse({ status: 400, description: 'Owner must be an admin user.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    @ApiResponse({ status: 404, description: 'Store or owner user not found.' })
    adminUpdate(@Param('id') id: string, @Body() adminUpdateStoreDto: AdminUpdateStoreDto) {
        return this.storesService.adminUpdate(id, adminUpdateStoreDto);
    }

    @Delete('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a store (admin only)' })
    @ApiParam({ name: 'id', type: String, description: 'Store UUID' })
    @ApiResponse({ status: 200, description: 'The store has been successfully deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    async adminRemove(@Param('id') id: string) {
        await this.storesService.adminRemove(id);
        return { message: 'Store deleted successfully' };
    }
}
