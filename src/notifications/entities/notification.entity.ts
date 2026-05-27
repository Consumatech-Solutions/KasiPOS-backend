import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  CREDIT_PAYMENT_REMINDER = 'credit_payment_reminder',
}

export type CreditPaymentNotificationMetadata = {
  transactionId: string;
  reminderKind: string;
  customerId?: string | null;
  customerName?: string | null;
  total: string;
  creditDueAt?: string | null;
  overdue?: boolean;
};

@Entity('notifications')
@Index('UQ_notifications_user_dedupe', ['userId', 'dedupeKey'], { unique: true })
@Index('IDX_notifications_user_read', ['userId', 'readAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: CreditPaymentNotificationMetadata | null;

  @Column({ name: 'dedupe_key' })
  dedupeKey: string;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
