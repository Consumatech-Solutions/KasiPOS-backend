import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('store_settings')
export class StoreSettings {
  @PrimaryColumn({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @OneToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  /**
   * When true (default), list prices are inclusive of VAT.
   * When false, VAT is added on top of the list price at checkout.
   */
  @Column({ name: 'vat_included_in_price', default: true })
  vatIncludedInPrice: boolean;

  /**
   * Credit settings for the store: limit, term type (fixed/variable), term (days).
   */
  @Column({ type: 'jsonb', nullable: true })
  credit: StoreCreditSetting | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export type StoreCreditSetting = {
  customerCredit: {
    creditLimit: number;
    termType: 'fixed' | 'variable';
    term?: number; // required when termType is 'fixed', optional when 'variable'
  };
};
