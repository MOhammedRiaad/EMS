import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum RevenueType {
    SUBSCRIPTION = 'subscription',
    SETUP_FEE = 'setup_fee',
    ADHOC = 'adhoc'
}

export enum RevenueStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

@Entity('platform_revenue')
export class PlatformRevenue extends TenantScopedEntityWithUpdate {
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: RevenueStatus,
        default: RevenueStatus.COMPLETED
    })
    status: RevenueStatus;

    @Column({
        type: 'enum',
        enum: RevenueType,
        default: RevenueType.SUBSCRIPTION
    })
    type: RevenueType;

    @Column({ name: 'external_reference', nullable: true })
    externalReference: string;

    @Column({ name: 'billing_period_start', type: 'timestamptz', nullable: true })
    billingPeriodStart: Date;

    @Column({ name: 'billing_period_end', type: 'timestamptz', nullable: true })
    billingPeriodEnd: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;
}
