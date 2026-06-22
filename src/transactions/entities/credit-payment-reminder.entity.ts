import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

export enum CreditReminderKind {
  T48H = 'T48H',
  T24H = 'T24H',
  T12H = 'T12H',
  T1H = 'T1H',
  AT_DUE = 'AT_DUE',
}

export enum CreditReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
}

@Entity('credit_payment_reminders')
export class CreditPaymentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({
    name: 'reminder_kind',
    type: 'enum',
    enum: CreditReminderKind,
  })
  reminderKind: CreditReminderKind;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({
    type: 'enum',
    enum: CreditReminderStatus,
    default: CreditReminderStatus.PENDING,
  })
  status: CreditReminderStatus;
}
