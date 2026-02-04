import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';

export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('plan_upgrade_requests')
export class PlanUpgradeRequest extends BaseEntityWithUpdate {
    @Column({ name: 'tenant_id', type: 'uuid' })
    @Index()
    tenantId: string;

    @Column({ name: 'requested_by_id', type: 'uuid' })
    requestedById: string;

    @Column({ name: 'current_plan', length: 50 })
    currentPlan: string;

    @Column({ name: 'requested_plan', length: 50 })
    requestedPlan: string;

    @Column({ type: 'text', nullable: true })
    reason: string | null;

    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    @Index()
    status: UpgradeRequestStatus;

    @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
    reviewedById: string | null;

    @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
    reviewedAt: Date | null;

    @Column({ name: 'review_notes', type: 'text', nullable: true })
    reviewNotes: string | null;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requested_by_id' })
    requestedBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by_id' })
    reviewedBy: User | null;
}
