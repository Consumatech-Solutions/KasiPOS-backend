import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Customer } from '../customers/entities/customer.entity';
import { DashboardStatsController } from './dashboard-stats.controller';
import { DashboardStatsService } from './dashboard-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Customer])],
  controllers: [DashboardStatsController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService],
})
export class DashboardStatsModule {}
