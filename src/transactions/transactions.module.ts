import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PendingTransactionSyncService } from './pending-transaction-sync.service';
import { Transaction } from './entities/transaction.entity';
import { PendingTransaction } from './entities/pending-transaction.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { SettingsModule } from '../settings/settings.module';
import { TempIdMappingsModule } from '../common/temp-id-mappings/temp-id-mappings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      PendingTransaction,
      Product,
      Customer,
    ]),
    VouchersModule,
    SettingsModule,
    TempIdMappingsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, PendingTransactionSyncService],
  exports: [TransactionsService, PendingTransactionSyncService],
})
export class TransactionsModule {}

