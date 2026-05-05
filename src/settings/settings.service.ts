import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StoreSettings,
  StoreCreditSetting,
} from './entities/store-settings.entity';
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
    if (dto.credit !== undefined) {
      const { customerCredit } = dto.credit;
      if (
        customerCredit.termType === 'fixed' &&
        (customerCredit.term == null || customerCredit.term === undefined)
      ) {
        throw new BadRequestException(
          'term is required when termType is "fixed"',
        );
      }
      settings.credit = dto.credit as any;
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

  async getCreditSettings(storeId: string): Promise<StoreCreditSetting | null> {
    const settings = await this.settingsRepository.findOne({
      where: { storeId },
    });
    return settings?.credit ?? null;
  }
}
