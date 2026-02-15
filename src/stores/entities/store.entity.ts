import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

export enum StoreStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export interface EnabledModules {
    groupbuying: boolean;
    marketplace: boolean;
    boph: boolean;
    campaigns: boolean;
}

export interface TradingHourSlot {
    start: string | null;
    end: string | null;
}

export interface TradingHours {
    monday: TradingHourSlot;
    tuesday: TradingHourSlot;
    wednesday: TradingHourSlot;
    thursday: TradingHourSlot;
    friday: TradingHourSlot;
    saturday: TradingHourSlot;
    sunday: TradingHourSlot;
}

@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ name: 'owner_id', nullable: true })
    ownerId: string | null; // References User(id); set when admin assigns store to store admin

    // New admin-only fields

    @Column({ name: 'client_id', nullable: true })
    clientId: string;

    @ManyToOne(() => Client, { nullable: true })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'contact_number', nullable: true })
    contactNumber: string;

    @Column({
        name: 'initial_status',
        type: 'enum',
        enum: StoreStatus,
        nullable: true,
    })
    initialStatus: StoreStatus;

    @Column({
        type: 'enum',
        enum: StoreStatus,
        default: StoreStatus.ACTIVE,
    })
    status: StoreStatus;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    latitude: string;

    @Column({ nullable: true })
    longitude: string;

    @Column({
        name: 'enabled_modules',
        type: 'jsonb',
        nullable: true,
        default: () => `'{"groupbuying": false, "marketplace": false, "boph": false, "campaigns": false}'`,
    })
    enabledModules: EnabledModules;

    @Column({
        name: 'trading_hours',
        type: 'jsonb',
        nullable: true,
    })
    tradingHours: TradingHours;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
