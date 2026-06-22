import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  FAILED = 'failed',
  PAID = 'paid',
}

export type TransactionItemPayload = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
};

export type TransactionDiscount = {
  discountType: 'amount' | 'percentage';
  discountAmount: number;
  discountReason: string;
};

export type TransactionCreditDetails = {
  paymentDate?: string;
  dueAt?: string;
  note?: string;
};

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ name: 'pending_customer_temp_id', nullable: true })
  pendingCustomerTempId: string | null;

  @Column({ type: 'jsonb' })
  items: TransactionItemPayload[];

  @Column({ name: 'payment_method' })
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money' | 'Credit';

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PAID,
  })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'voucher_code', nullable: true })
  voucherCode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  discount: TransactionDiscount | null;

  @Column({ name: 'credit_details', type: 'jsonb', nullable: true })
  creditDetails: TransactionCreditDetails | null;

  @Column({ name: 'credit_due_at', type: 'timestamptz', nullable: true })
  creditDueAt: Date | null;

  @Column({ name: 'credit_settled_at', type: 'timestamptz', nullable: true })
  creditSettledAt: Date | null;

  @Column({
    name: 'last_overdue_reminder_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastOverdueReminderAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
