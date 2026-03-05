import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreSettings } from './entities/store-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(StoreSettings)
    private settingsRepository: Repository<StoreSettings>,
  ) {}

  /**
   * Get settings for a store. Creates default settings if none exist.
   */
  async getForStore(storeId: string): Promise<StoreSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { storeId },
    });
    if (!settings) {
      settings = this.settingsRepository.create({
        storeId,
        vatIncludedInPrice: true,
      });
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  /**
   * Update settings for a store. Creates default settings if none exist, then updates.
   */
  async updateForStore(
    storeId: string,
    dto: UpdateSettingsDto,
  ): Promise<StoreSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { storeId },
    });
    if (!settings) {
      settings = this.settingsRepository.create({
        storeId,
        vatIncludedInPrice: true,
      });
      settings = await this.settingsRepository.save(settings);
    }
    if (dto.vatIncludedInPrice !== undefined) {
      settings.vatIncludedInPrice = dto.vatIncludedInPrice;
    }
    return this.settingsRepository.save(settings);
  }

  /**
   * Returns whether VAT is included in list price for the given store.
   * Use this in checkout/transaction logic. Defaults to true if no settings row exists.
   */
  async isVatIncludedInPrice(storeId: string): Promise<boolean> {
    const settings = await this.settingsRepository.findOne({
      where: { storeId },
    });
    return settings?.vatIncludedInPrice ?? true;
  }
}
