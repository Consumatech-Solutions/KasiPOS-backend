import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'vat_number', nullable: true })
    vatNumber: string;

    @Column({ name: 'logo_url', nullable: true })
    logoUrl: string;

    @Column({ name: 'receipt_header', nullable: true })
    receiptHeader: string;

    @Column({ name: 'receipt_footer', nullable: true })
    receiptFooter: string;

    @Column({ name: 'is_setup_complete', default: false })
    isSetupComplete: boolean;

    @Column({ name: 'owner_id' })
    ownerId: string; // References User(id)

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
