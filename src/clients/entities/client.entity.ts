import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClientType {
  BUSINESS = 'business',
  INDIVIDUAL = 'individual',
  OTHER = 'other',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ClientType,
    default: ClientType.INDIVIDUAL,
  })
  type: ClientType;

  @Column({ name: 'id_number', nullable: true })
  idNumber: string;

  @Column({ name: 'physical_address', nullable: true })
  physicalAddress: string;

  @Column({ name: 'contact_number', nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
