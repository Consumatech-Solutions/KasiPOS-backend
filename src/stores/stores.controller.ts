import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Request,
    NotFoundException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new store' })
    @ApiResponse({ status: 201, description: 'The store has been successfully created.' })
    create(@Body() createStoreDto: CreateStoreDto, @Request() req) {
        return this.storesService.create(createStoreDto, req.user.userId);
    }

    @Get('my-store')
    @ApiOperation({ summary: 'Get current user store' })
    @ApiResponse({ status: 200, description: 'Return the store associated with the user.' })
    @ApiResponse({ status: 404, description: 'Store not found.' })
    async getMyStore(@Request() req) {
        const store = await this.storesService.findByUser(req.user.userId);
        if (!store) {
            // We might want to return null or 404. Let's return 404 if strict, 
            // but for frontend ease 404 is okay to signal "need setup".
            throw new NotFoundException('Store not found for this user');
        }
        return store;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get store by id' })
    findOne(@Param('id') id: string) {
        return this.storesService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a store' })
    update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
        return this.storesService.update(+id, updateStoreDto);
    }
}
