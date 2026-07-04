import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum StoreCurrency {
  USD = 'USD',
  CDF = 'CDF',
  ZAR = 'ZAR',
}

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

  @Column({
    type: 'enum',
    enum: StoreCurrency,
    default: StoreCurrency.USD,
  })
  currency: StoreCurrency;

  /** 1 USD = ? CDF */
  @Column({
    name: 'cdf_usd_ex_rate',
    type: 'decimal',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  cdfUsdExRate: number | null;

  /** 1 USD = ? ZAR */
  @Column({
    name: 'zar_usd_ex_rate',
    type: 'decimal',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  zarUsdExRate: number | null;

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
