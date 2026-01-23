import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceStore } from './entities/marketplace-store.entity';
import { CreateMarketplaceStoreDto } from './dto/create-marketplace-store.dto';
import { UpdateMarketplaceStoreDto } from './dto/update-marketplace-store.dto';

@Injectable()
export class MarketplaceStoresService {
  constructor(
    @InjectRepository(MarketplaceStore)
    private marketplaceStoresRepository: Repository<MarketplaceStore>,
  ) {}

  async create(dto: CreateMarketplaceStoreDto): Promise<MarketplaceStore> {
    const store = this.marketplaceStoresRepository.create({
      code: dto.code,
      name: dto.name,
      logoUrl: dto.logoUrl || null,
      description: dto.description || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.marketplaceStoresRepository.save(store);
  }

  async findAll(activeOnly: boolean = false): Promise<MarketplaceStore[]> {
    if (activeOnly) {
      return this.marketplaceStoresRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }
    return this.marketplaceStoresRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<MarketplaceStore> {
    const store = await this.marketplaceStoresRepository.findOne({
      where: { id },
    });

    if (!store) {
      throw new NotFoundException(`Marketplace store not found: ${id}`);
    }

    return store;
  }

  async findByCode(code: string): Promise<MarketplaceStore> {
    const store = await this.marketplaceStoresRepository.findOne({
      where: { code },
    });

    if (!store) {
      throw new NotFoundException(
        `Marketplace store not found with code: ${code}`,
      );
    }

    return store;
  }

  async update(
    id: string,
    dto: UpdateMarketplaceStoreDto,
  ): Promise<MarketplaceStore> {
    const store = await this.findOne(id);

    if (dto.name !== undefined) {
      store.name = dto.name;
    }
    if (dto.logoUrl !== undefined) {
      store.logoUrl = dto.logoUrl;
    }
    if (dto.description !== undefined) {
      store.description = dto.description;
    }
    if (dto.isActive !== undefined) {
      store.isActive = dto.isActive;
    }

    return this.marketplaceStoresRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.marketplaceStoresRepository.remove(store);
  }
}
