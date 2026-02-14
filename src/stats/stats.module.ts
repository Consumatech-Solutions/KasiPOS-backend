import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Store } from '../stores/entities/store.entity';
import { Client } from '../clients/entities/client.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { MarketplaceOrder } from '../marketplace-orders/entities/marketplace-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      Client,
      Transaction,
      Campaign,
      PurchaseOrder,
      MarketplaceOrder,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
