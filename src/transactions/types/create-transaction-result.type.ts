import { Transaction } from '../entities/transaction.entity';

export type CreateTransactionCommitted = {
  status: 'committed';
  transaction: Transaction;
};

export type CreateTransactionPending = {
  status: 'pending';
  pendingTransactionId: string;
};

export type CreateTransactionResult =
  | CreateTransactionCommitted
  | CreateTransactionPending;
