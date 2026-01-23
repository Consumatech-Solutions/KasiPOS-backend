import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceStoresController } from './marketplace-stores.controller';
import { MarketplaceStoresService } from './marketplace-stores.service';
import { MarketplaceStore } from './entities/marketplace-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceStore])],
  controllers: [MarketplaceStoresController],
  providers: [MarketplaceStoresService],
  exports: [MarketplaceStoresService],
})
export class MarketplaceStoresModule {}
