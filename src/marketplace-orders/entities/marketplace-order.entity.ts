import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export type MarketplaceOrderItemPayload = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
};

export enum MarketplaceOrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('marketplace_orders')
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_code', unique: true })
  orderCode: string;

  @Column({ name: 'marketplace_store_id' })
  marketplaceStoreId: string; // e.g., 'takealot', 'amazon', 'makro'

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: string; // The KasiPOS store placing the order

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'jsonb' })
  items: MarketplaceOrderItemPayload[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({
    name: 'vat_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  vatAmount: number;

  @Column({
    name: 'service_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'payment_method' })
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money';

  @Column({
    type: 'enum',
    enum: MarketplaceOrderStatus,
    default: MarketplaceOrderStatus.PENDING,
  })
  status: MarketplaceOrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
