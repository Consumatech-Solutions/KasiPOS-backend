import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AdminCreateStoreDto } from './dto/admin-create-store.dto';
import { AdminUpdateStoreDto } from './dto/admin-update-store.dto';
import { GetStoresDto } from './dto/get-stores.dto';
import { AssignStoreDto } from './dto/assign-store.dto';
import { RoleTransferDto } from './dto/role-transfer.dto';
import { ChangeStoreAdminDto } from './dto/change-store-admin.dto';
import { RoleTransfer } from './entities/role-transfer.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { SmsService } from '../services/sms.service';
import { randomBytes } from 'crypto';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        @InjectRepository(RoleTransfer)
        private roleTransfersRepository: Repository<RoleTransfer>,
        private readonly dataSource: DataSource,
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

    /**
     * Store admin transfers ownership immediately, then records transfer as completed.
     */
    async createRoleTransfer(
        currentUserId: string,
        currentUserStoreId: string | null | undefined,
        dto: RoleTransferDto,
    ): Promise<RoleTransfer> {
        if (!currentUserStoreId) {
            throw new ForbiddenException('Store admin must be linked to a store');
        }
        const store = await this.storesRepository.findOne({ where: { id: currentUserStoreId } });
        if (!store) {
            throw new NotFoundException('Store not found');
        }
        if (store.ownerId !== currentUserId) {
            throw new ForbiddenException('Only the store owner can request a role transfer');
        }
        if (dto.newStoreAdminId === currentUserId) {
            throw new BadRequestException('Cannot transfer ownership to yourself');
        }

        const newOwner = await this.usersService.findById(dto.newStoreAdminId);
        if (!newOwner) {
            throw new NotFoundException('New store admin user not found');
        }
        if (newOwner.storeId !== store.id) {
            throw new BadRequestException('The selected user is not a staff member of this store');
        }
        if (newOwner.role !== UserRole.STAFF) {
            throw new BadRequestException('The selected user must be a staff member (role: staff)');
        }

        const result = await this.executeRoleTransferTransaction(
            store.id,
            currentUserId,
            dto.newStoreAdminId,
            dto.oldStoreAdminState,
        );

        const completed = this.roleTransfersRepository.create({
            storeId: store.id,
            fromUserId: currentUserId,
            toUserId: dto.newStoreAdminId,
            oldStoreAdminState: dto.oldStoreAdminState,
            status: 'completed',
        });
        const saved = await this.roleTransfersRepository.save(completed);

        await this.sendRoleTransferApprovedSms(result.newOwner, result.previousOwner, store.name);

        await this.authService.invalidateAccessTokensForUsers([
            currentUserId,
            dto.newStoreAdminId,
        ]);

        return saved;
    }

    private async executeRoleTransferTransaction(
        storeId: string,
        fromUserId: string,
        toUserId: string,
        oldStoreAdminState: 'deleted' | 'staff user',
    ): Promise<{ store: Store; newOwner: User; previousOwner: User }> {
        return this.dataSource.transaction(async (manager) => {
            const storeRepo = manager.getRepository(Store);
            const userRepo = manager.getRepository(User);

            const storeRow = await storeRepo.findOne({ where: { id: storeId } });
            if (!storeRow) {
                throw new NotFoundException('Store not found');
            }
            const newUserRow = await userRepo.findOne({ where: { id: toUserId } });
            const oldUserRow = await userRepo.findOne({ where: { id: fromUserId } });
            if (!newUserRow || !oldUserRow) {
                throw new NotFoundException('User not found');
            }

            storeRow.ownerId = newUserRow.id;
            await storeRepo.save(storeRow);

            newUserRow.role = UserRole.STORE_ADMIN;
            newUserRow.storeId = storeId;
            await userRepo.save(newUserRow);

            if (oldStoreAdminState === 'staff user') {
                oldUserRow.role = UserRole.STAFF;
                oldUserRow.storeId = storeId;
                await userRepo.save(oldUserRow);
            } else {
                oldUserRow.isActive = false;
                oldUserRow.storeId = null;
                await userRepo.save(oldUserRow);
            }

            return {
                store: storeRow,
                newOwner: newUserRow,
                previousOwner: oldUserRow,
            };
        });
    }

    private async sendRoleTransferApprovedSms(
        newOwner: User,
        previousOwner: User,
        storeName: string,
    ): Promise<void> {
        const newMsg = `KasiPOS: You are now the store admin for "${storeName}".`;
        const oldMsg = `KasiPOS: You are no longer the store admin for "${storeName}".`;
        if (newOwner.phone) {
            await this.smsService.send(newOwner.phone, newMsg).catch(() => {});
        }
        if (previousOwner.phone) {
            await this.smsService.send(previousOwner.phone, oldMsg).catch(() => {});
        }
    }

    /**
     * Admin: change store admin. Old admin becomes staff; new admin by userId or new user by name+phone.
     */
    async adminChangeStoreAdmin(dto: ChangeStoreAdminDto): Promise<{
        store: Store;
        newOwner: User;
        previousOwner: User;
    }> {
        const { newStoreAdmin } = dto;
        const hasUserId = !!newStoreAdmin.userId;
        const hasNameNumber = !!(newStoreAdmin.name && newStoreAdmin.number);
        if (hasUserId === hasNameNumber) {
            throw new BadRequestException(
                'Provide exactly one of: newStoreAdmin.userId OR newStoreAdmin.name and newStoreAdmin.number',
            );
        }

        const store = await this.findOne(dto.store);
        if (!store.ownerId) {
            throw new BadRequestException('Store has no owner to replace');
        }

        const oldOwner = await this.usersService.findById(store.ownerId);
        if (!oldOwner) {
            throw new NotFoundException('Current store admin not found');
        }

        let newOwner: User;
        if (hasUserId) {
            const u = await this.usersService.findById(newStoreAdmin.userId!);
            if (!u) {
                throw new NotFoundException('New store admin user not found');
            }
            if (u.id === oldOwner.id) {
                throw new BadRequestException('New store admin must be a different user');
            }
            newOwner = u;
        } else {
            const existing = await this.usersService.findByPhone(newStoreAdmin.number!);
            if (existing) {
                throw new BadRequestException('A user with this phone number already exists.');
            }
            const tempPassword = randomBytes(8).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
            const email = `storeadmin-${store.id}-${Date.now()}@kasipos.local`;
            newOwner = await this.usersService.createWithPassword({
                email,
                name: newStoreAdmin.name!,
                phone: newStoreAdmin.number!,
                role: UserRole.STORE_ADMIN,
                storeId: store.id,
                password: tempPassword,
            });
            const resetToken = await this.authService.createStoreAdminResetToken(newOwner.id);
            const userAppUrl =
                this.configService.get<string>('FRONTEND_URL_SMS')?.split(',')[0]?.trim() ||
                'http://localhost:9002';
            const resetLink = `${userAppUrl}/set-password-store-admin?token=${resetToken}`;
            await this.smsService
                .send(
                    newStoreAdmin.number!,
                    `KasiPOS: Temporary password ${tempPassword}. Set your password: ${resetLink}`,
                )
                .catch(() => {});
        }

        const result = await this.dataSource.transaction(async (manager) => {
            const storeRepo = manager.getRepository(Store);
            const userRepo = manager.getRepository(User);

            const storeRow = await storeRepo.findOne({ where: { id: store.id } });
            const oldRow = await userRepo.findOne({ where: { id: oldOwner.id } });
            const newRow = await userRepo.findOne({ where: { id: newOwner.id } });
            if (!storeRow || !oldRow || !newRow) {
                throw new NotFoundException('Store or user not found');
            }

            oldRow.role = UserRole.STAFF;
            oldRow.storeId = store.id;
            await userRepo.save(oldRow);

            newRow.role = UserRole.STORE_ADMIN;
            newRow.storeId = store.id;
            await userRepo.save(newRow);

            storeRow.ownerId = newRow.id;
            await storeRepo.save(storeRow);

            return { store: storeRow, newOwner: newRow, previousOwner: oldRow };
        });

        const newMsg = `KasiPOS: You have been set as the new store admin for "${store.name}".`;
        const oldMsg = `KasiPOS: You are no longer the store admin for "${store.name}". You remain a staff user for this store.`;
        if (result.newOwner.phone) {
            await this.smsService.send(result.newOwner.phone, newMsg).catch(() => {});
        }
        if (result.previousOwner.phone) {
            await this.smsService.send(result.previousOwner.phone, oldMsg).catch(() => {});
        }

        await this.authService.invalidateAccessTokensForUsers([
            result.previousOwner.id,
            result.newOwner.id,
        ]);

        return result;
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
        // if (store.ownerId) {
        //     throw new BadRequestException('Store already has an owner. Unassign or use a different store.');
        // }
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
        const resetToken = await this.authService.createStoreAdminResetToken(user.id);
        // Store admins are normal users: use the normal user app (first URL in FRONTEND_URL)
        const userAppUrl =
            this.configService.get<string>('FRONTEND_URL_SMS')?.split(',')[0]?.trim() ||
            'http://localhost:9002';
        const resetLink = `${userAppUrl}/set-password-store-admin?token=${resetToken}`;
        const smsMessage = `KasiPOS: Your temporary password is ${tempPassword}. Phone: ${dto.number}. Set your password here: ${resetLink}`;
        console.log(smsMessage);
        await this.smsService.send(dto.number, smsMessage);
        return {
            user: { id: user.id, name: user.name, phone: user.phone },
            message: 'Store assigned. Store admin will receive an SMS with temporary password and reset link.',
        };
    }
}
