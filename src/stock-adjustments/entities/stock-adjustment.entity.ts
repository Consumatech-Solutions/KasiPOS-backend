import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../catalogue/products/entities/product.entity';
import { Store } from '../../stores/entities/store.entity';

export enum StockAdjustmentReason {
  NEW_STOCK_RECEIVED = 'New stock received',
  SHRINKAGE = 'Shrinkage',
  DAMAGES = 'Damages',
  EXPIRED = 'Expired',
  OTHER = 'Other',
}

@Entity('stock_adjustments')
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'old_stock', type: 'int' })
  oldStock: number;

  @Column({ name: 'new_stock', type: 'int' })
  newStock: number;

  @Column({
    type: 'enum',
    enum: StockAdjustmentReason,
  })
  reason: StockAdjustmentReason;

  @Column({ type: 'text', nullable: true })
  note: string | null;

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
