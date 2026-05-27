import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PendingTransactionSyncService } from './pending-transaction-sync.service';
import { CreditReminderService } from './credit-reminder.service';
import { CreditReminderScheduler } from './credit-reminder.scheduler';
import { Transaction } from './entities/transaction.entity';
import { CreditPaymentReminder } from './entities/credit-payment-reminder.entity';
import { PendingTransaction } from './entities/pending-transaction.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { SettingsModule } from '../settings/settings.module';
import { TempIdMappingsModule } from '../common/temp-id-mappings/temp-id-mappings.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      CreditPaymentReminder,
      PendingTransaction,
      Product,
      Customer,
    ]),
    VouchersModule,
    SettingsModule,
    TempIdMappingsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    PendingTransactionSyncService,
    CreditReminderService,
    CreditReminderScheduler,
  ],
  exports: [TransactionsService, PendingTransactionSyncService],
})
export class TransactionsModule {}
