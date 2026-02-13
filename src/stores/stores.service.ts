import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AdminCreateStoreDto } from './dto/admin-create-store.dto';
import { AdminUpdateStoreDto } from './dto/admin-update-store.dto';
import { GetStoresDto } from './dto/get-stores.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        private usersService: UsersService,
    ) { }

    // ==================== Non-Admin Methods ====================

    async create(createStoreDto: CreateStoreDto, userId: string): Promise<Store> {
        const existingStore = await this.findByUser(userId);
        if (existingStore) {
            // For now, 1 user = 1 store. Return existing if present.
            return existingStore;
        }

        const store = this.storesRepository.create({
            ...createStoreDto,
            ownerId: userId,
        });
        return this.storesRepository.save(store);
    }

    async findOne(id: number): Promise<Store> {
        const store = await this.storesRepository.findOne({ 
            where: { id },
            relations: ['client'],
        });
        if (!store) {
            throw new NotFoundException(`Store with ID ${id} not found`);
        }
        return store;
    }

    async findByUser(userId: string): Promise<Store | null> {
        return this.storesRepository.findOne({ 
            where: { ownerId: userId },
            relations: ['client'],
        });
    }

    async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
        const store = await this.findOne(id);
        Object.assign(store, updateStoreDto);
        return this.storesRepository.save(store);
    }

    // ==================== Admin-Only Methods ====================

    async adminCreate(adminCreateStoreDto: AdminCreateStoreDto): Promise<Store> {
        // Verify owner exists and is an admin
        const owner = await this.usersService.findById(adminCreateStoreDto.ownerId);
        if (!owner) {
            throw new NotFoundException('Owner user not found');
        }
        if (owner.role !== UserRole.ADMIN) {
            throw new BadRequestException('Owner must be an admin user');
        }

        const store = this.storesRepository.create(adminCreateStoreDto);
        return this.storesRepository.save(store);
    }

    async adminFindAll(query: GetStoresDto): Promise<PaginationResult<Store>> {
        const { page = 1, limit = 10, search, status } = query;

        const queryBuilder = this.storesRepository.createQueryBuilder('store')
            .leftJoinAndSelect('store.client', 'client');

        if (search) {
            queryBuilder.andWhere(
                '(store.name ILIKE :search OR store.address ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (status) {
            queryBuilder.andWhere('store.initial_status = :status', { status });
        }

        queryBuilder
            .orderBy('store.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async adminFindOne(id: number): Promise<Store> {
        return this.findOne(id);
    }

    async adminUpdate(id: number, adminUpdateStoreDto: AdminUpdateStoreDto): Promise<Store> {
        const store = await this.findOne(id);

        // If ownerId is being updated, verify the new owner exists and is an admin
        if (adminUpdateStoreDto.ownerId) {
            const owner = await this.usersService.findById(adminUpdateStoreDto.ownerId);
            if (!owner) {
                throw new NotFoundException('Owner user not found');
            }
            if (owner.role !== UserRole.ADMIN) {
                throw new BadRequestException('Owner must be an admin user');
            }
        }

        Object.assign(store, adminUpdateStoreDto);
        return this.storesRepository.save(store);
    }

    async adminRemove(id: number): Promise<void> {
        const store = await this.findOne(id);
        await this.storesRepository.remove(store);
    }
}
