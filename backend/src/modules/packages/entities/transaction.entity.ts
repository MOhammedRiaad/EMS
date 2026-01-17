import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Studio } from '../../studios/entities/studio.entity';
import { User } from '../../auth/entities/user.entity';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
    REFUND = 'refund'
}

export enum TransactionCategory {
    PACKAGE_SALE = 'package_sale',
    SESSION_FEE = 'session_fee',
    REFUND = 'refund',
    OTHER = 'other'
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'studio_id', nullable: true })
    studioId: string;

    @ManyToOne(() => Studio)
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;

    @Column({ type: 'varchar', length: 20 })
    type: TransactionType;

    @Column({ type: 'varchar', length: 30 })
    category: TransactionCategory;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ name: 'running_balance', type: 'decimal', precision: 10, scale: 2, nullable: true })
    runningBalance: number;

    @Column({ name: 'reference_type', length: 50, nullable: true })
    referenceType: string;

    @Column({ name: 'reference_id', type: 'uuid', nullable: true })
    referenceId: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
