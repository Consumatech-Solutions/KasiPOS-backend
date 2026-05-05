import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Entity('pending_transactions')
export class PendingTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ type: 'jsonb' })
  payload: CreateTransactionDto;

  @Column({
    name: 'unresolved_temp_ids',
    type: 'text',
    array: true,
    default: '{}',
  })
  unresolvedTempIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
