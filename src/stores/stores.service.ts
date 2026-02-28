import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AdminCreateStoreDto } from './dto/admin-create-store.dto';
import { AdminUpdateStoreDto } from './dto/admin-update-store.dto';
import { GetStoresDto } from './dto/get-stores.dto';
import { AssignStoreDto } from './dto/assign-store.dto';
import { PaginationResult } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { SmsService } from '../services/sms.service';
import { randomBytes } from 'crypto';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        private usersService: UsersService,
        private authService: AuthService,
        private smsService: SmsService,
        private configService: ConfigService,
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

    async findOne(id: string): Promise<Store> {
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

    async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
        const store = await this.findOne(id);
        await this.storesRepository.update(id, updateStoreDto);
        return this.findOne(id);
    }

    // ==================== Admin-Only Methods ====================

    async adminCreate(adminCreateStoreDto: AdminCreateStoreDto): Promise<Store> {
        const payload: Partial<Store> = { ...adminCreateStoreDto };
        if (adminCreateStoreDto.ownerId) {
            const owner = await this.usersService.findById(adminCreateStoreDto.ownerId);
            if (!owner) {
                throw new NotFoundException('Owner user not found');
            }
            payload.ownerId = owner.id;
        } else {
            payload.ownerId = null;
        }
        const savedStore = await this.storesRepository.save(this.storesRepository.create(payload));
        if (adminCreateStoreDto.ownerId) {
            await this.usersService.update(adminCreateStoreDto.ownerId, {
                storeId: savedStore.id,
                role: UserRole.STORE_ADMIN,
            });
        }
        return savedStore;
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

    async adminFindOne(id: string): Promise<Store> {
        return this.findOne(id);
    }

    async adminUpdate(id: string, adminUpdateStoreDto: AdminUpdateStoreDto): Promise<Store> {
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
        console.log(store);
        return this.storesRepository.save(store);
    }

    async adminRemove(id: string): Promise<void> {
        const store = await this.findOne(id);
        await this.storesRepository.remove(store);
    }

    /** Admin: assign a store to a new store admin. Creates user, sets ownerId, sends SMS with temp password and reset link. */
    async assignStore(dto: AssignStoreDto): Promise<{ user: { id: string; name: string; phone: string }; message: string }> {
        const store = await this.findOne(dto.store);
        if (store.ownerId) {
            throw new BadRequestException('Store already has an owner. Unassign or use a different store.');
        }
        const existingUser = await this.usersService.findByPhone(dto.number);
        if (existingUser) {
            throw new BadRequestException('A user with this phone number already exists.');
        }
        const tempPassword = randomBytes(8).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
        const email = `storeadmin-${store.id}-${Date.now()}@kasipos.local`;
        const user = await this.usersService.createWithPassword({
            email,
            name: dto.name,
            phone: dto.number,
            role: UserRole.STORE_ADMIN,
            storeId: store.id,
            password: tempPassword,
        });
        store.ownerId = user.id;
        await this.storesRepository.save(store);
        const resetToken = this.authService.signStoreAdminResetToken(user.id);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:9002';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        const smsMessage = `KasiPOS: Your temporary password is ${tempPassword}. Phone: ${dto.number}. Set your password here: ${resetLink}`;
        await this.smsService.send(dto.number, smsMessage);
        return {
            user: { id: user.id, name: user.name, phone: user.phone },
            message: 'Store assigned. Store admin will receive an SMS with temporary password and reset link.',
        };
    }
}
