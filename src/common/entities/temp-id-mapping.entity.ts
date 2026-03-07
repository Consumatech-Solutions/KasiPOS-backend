import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('temp_id_mappings')
export class TempIdMapping {
  @PrimaryColumn({ name: 'temp_id', type: 'varchar' })
  tempId: string;

  @Column({ name: 'server_id', type: 'uuid' })
  serverId: string;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
