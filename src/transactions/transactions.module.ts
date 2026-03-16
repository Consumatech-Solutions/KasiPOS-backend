import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Product, Customer]),
    VouchersModule,
    SettingsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}

