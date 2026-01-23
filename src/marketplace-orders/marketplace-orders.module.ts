import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceOrdersController } from './marketplace-orders.controller';
import { MarketplaceOrdersService } from './marketplace-orders.service';
import { MarketplaceOrder } from './entities/marketplace-order.entity';
import { Store } from '../stores/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceOrder, Store])],
  controllers: [MarketplaceOrdersController],
  providers: [MarketplaceOrdersService],
  exports: [MarketplaceOrdersService],
})
export class MarketplaceOrdersModule {}
