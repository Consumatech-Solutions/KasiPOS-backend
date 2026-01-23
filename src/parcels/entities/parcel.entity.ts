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

export enum ParcelStatus {
  INCOMING = 'Incoming',
  RECEIVED = 'Received',
  COLLECTED = 'Collected',
}

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'delivery_number' })
  deliveryNumber: string;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({
    type: 'enum',
    enum: ParcelStatus,
    default: ParcelStatus.INCOMING,
  })
  status: ParcelStatus;

  @Column({ name: 'collection_code', nullable: true })
  collectionCode: string | null;

  @Column({ name: 'receipt_code', nullable: true })
  receiptCode: string | null;

  @Column({ name: 'date_received', type: 'timestamp', nullable: true })
  dateReceived: Date | null;

  @Column({ name: 'date_collected', type: 'timestamp', nullable: true })
  dateCollected: Date | null;

  @Column({ name: 'collecting_person_name', nullable: true })
  collectingPersonName: string | null;

  @Column({ name: 'collecting_person_phone', nullable: true })
  collectingPersonPhone: string | null;

  @Column({ name: 'collecting_person_id', nullable: true })
  collectingPersonId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
