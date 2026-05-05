import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingTransaction } from './entities/pending-transaction.entity';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

/**
 * After temp-id mappings are saved (customer/product sync), patches staged
 * transactions and finalizes pending rows when all IDs are resolved.
 */
@Injectable()
export class PendingTransactionSyncService {
  private readonly logger = new Logger(PendingTransactionSyncService.name);

  constructor(
    @InjectRepository(PendingTransaction)
    private readonly pendingRepository: Repository<PendingTransaction>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async onCustomerMapped(
    tempId: string,
    serverId: string,
    storeId?: string | null,
  ): Promise<void> {
    await this.transactionsService.patchTransactionsForCustomerTemp(
      tempId,
      serverId,
      storeId,
    );

    const pendings = await this.pendingRepository
      .createQueryBuilder('p')
      .where(':tid = ANY(p.unresolved_temp_ids)', { tid: tempId })
      .getMany();

    for (const pending of pendings) {
      await this.tryFinalizePending(pending, 'customer', tempId, serverId);
    }
  }

  async onProductMapped(tempId: string, serverId: string): Promise<void> {
    const pendings = await this.pendingRepository
      .createQueryBuilder('p')
      .where(':tid = ANY(p.unresolved_temp_ids)', { tid: tempId })
      .getMany();

    for (const pending of pendings) {
      await this.tryFinalizePending(pending, 'product', tempId, serverId);
    }
  }

  private async tryFinalizePending(
    pending: PendingTransaction,
    kind: 'customer' | 'product',
    tempId: string,
    serverId: string,
  ): Promise<void> {
    const payload = this.applyMapping(
      {
        ...pending.payload,
        items: pending.payload.items.map((i) => ({ ...i })),
      },
      kind,
      tempId,
      serverId,
    );

    const unresolved =
      await this.transactionsService.computeUnresolvedTempIds(payload);
    pending.payload = payload;
    pending.unresolvedTempIds = unresolved;

    if (unresolved.length > 0) {
      await this.pendingRepository.save(pending);
      return;
    }

    const fullyResolved =
      await this.transactionsService.resolveAllTempIdsInDto(payload);
    const stillUnresolved =
      await this.transactionsService.computeUnresolvedTempIds(fullyResolved);
    if (stillUnresolved.length > 0) {
      pending.payload = fullyResolved;
      pending.unresolvedTempIds = stillUnresolved;
      await this.pendingRepository.save(pending);
      return;
    }

    try {
      await this.transactionsService.commitResolvedTransactionAndDeletePending(
        fullyResolved,
        {
          isOfflineRequest: true,
          pendingCustomerTempId: null,
        },
        pending.id,
      );
    } catch (err) {
      this.logger.error(
        `Failed to finalize pending transaction ${pending.id}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  private applyMapping(
    payload: CreateTransactionDto,
    kind: 'customer' | 'product',
    tempId: string,
    serverId: string,
  ): CreateTransactionDto {
    const out = { ...payload, items: payload.items.map((i) => ({ ...i })) };
    if (kind === 'customer' && String(out.customerId ?? '') === tempId) {
      out.customerId = serverId;
    }
    if (kind === 'product') {
      for (let i = 0; i < out.items.length; i++) {
        if (String(out.items[i].productId) === tempId) {
          out.items[i].productId = serverId;
        }
      }
    }
    return out;
  }
}
