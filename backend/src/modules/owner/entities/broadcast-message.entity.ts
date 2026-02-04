import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BroadcastType {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    IN_APP = 'IN_APP',
}

export enum BroadcastStatus {
    DRAFT = 'DRAFT',
    SCHEDULED = 'SCHEDULED',
    SENDING = 'SENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

export enum BroadcastAudience {
    ALL_TENANTS = 'ALL_TENANTS',
    TENANT_OWNERS = 'TENANT_OWNERS',
    ALL_COACHES = 'ALL_COACHES',
    ALL_CLIENTS = 'ALL_CLIENTS',
    SPECIFIC_PLANS = 'SPECIFIC_PLANS',
}

@Entity('broadcast_messages')
export class BroadcastMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    subject: string;

    @Column('text')
    body: string;

    @Column({
        type: 'enum',
        enum: BroadcastType,
        default: BroadcastType.EMAIL,
    })
    type: BroadcastType;

    @Column({
        type: 'enum',
        enum: BroadcastAudience,
        default: BroadcastAudience.ALL_TENANTS,
    })
    targetAudience: BroadcastAudience;

    @Column('simple-array', { nullable: true })
    targetPlans: string[]; // For SPECIFIC_PLANS audience

    @Column({
        type: 'enum',
        enum: BroadcastStatus,
        default: BroadcastStatus.DRAFT,
    })
    status: BroadcastStatus;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @Column('jsonb', { nullable: true })
    stats: {
        totalRecipients: number;
        successCount: number;
        failureCount: number;
        openRate?: number;
    };

    @Column('uuid')
    createdBy: string; // Owner User ID

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
