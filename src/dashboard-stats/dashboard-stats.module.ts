import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { DashboardStatsController } from './dashboard-stats.controller';
import { DashboardStatsService } from './dashboard-stats.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Customer, Product]),
    SettingsModule,
  ],
  controllers: [DashboardStatsController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService],
})
export class DashboardStatsModule {}
