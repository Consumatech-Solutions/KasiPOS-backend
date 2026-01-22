import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Product } from '../catalogue/products/entities/product.entity';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Product]), VouchersModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}

