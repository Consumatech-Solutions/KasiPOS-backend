import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('transaction_idempotency')
@Unique(['storeId', 'idempotencyKey'])
export class TransactionIdempotency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_transaction_idempotency_store_id')
  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 36 })
  idempotencyKey: string;

  @Column({ name: 'result_json', type: 'jsonb' })
  resultJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
