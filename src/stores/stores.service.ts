import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
    ) { }

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
        const store = await this.storesRepository.findOne({ where: { id } });
        if (!store) {
            throw new NotFoundException(`Store with ID ${id} not found`);
        }
        return store;
    }

    async findByUser(userId: string): Promise<Store | null> {
        return this.storesRepository.findOne({ where: { ownerId: userId } });
    }

    async update(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
        const store = await this.findOne(id);
        Object.assign(store, updateStoreDto);
        return this.storesRepository.save(store);
    }
}
