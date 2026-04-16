import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { PendingTransaction } from './entities/pending-transaction.entity';
import { VouchersService } from '../vouchers/vouchers.service';
import { TempIdMappingsService } from '../common/temp-id-mappings/temp-id-mappings.service';
import { SettingsService } from '../settings/settings.service';

describe('TransactionsService', () => {
  it('throws when Idempotency-Key is present but not a valid UUID', async () => {
    const service = new TransactionsService(
      {} as DataSource,
      {} as Repository<Transaction>,
      {} as Repository<PendingTransaction>,
      {} as VouchersService,
      {} as TempIdMappingsService,
      {} as SettingsService,
    );
    await expect(
      service.create({} as any, { idempotencyKey: 'not-a-uuid' }),
    ).rejects.toThrow(BadRequestException);
  });
});
