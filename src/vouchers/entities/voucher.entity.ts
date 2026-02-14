import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum VoucherType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('vouchers')
@Index(['storeId', 'code'], { unique: true })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: VoucherType,
  })
  type: VoucherType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'min_purchase', type: 'decimal', precision: 10, scale: 2 })
  minPurchase: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'max_uses_per_customer', type: 'int', nullable: true })
  maxUsesPerCustomer: number | null;

  @Column({ name: 'current_uses', type: 'int', default: 0 })
  currentUses: number;

  @Column({ name: 'customer_usages', type: 'jsonb', nullable: true })
  customerUsages: Record<string, number> | null;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
