import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity('usage_metrics')
@Index(['tenantId', 'metricType', 'date'])
export class UsageMetric extends BaseEntity {
    @Column({ name: 'tenant_id', type: 'uuid' })
    @Index()
    tenantId: string;

    @Column({ name: 'metric_type', length: 50 })
    @Index()
    metricType: string; // 'clients', 'coaches', 'sessions', 'sms', 'email', 'storage', 'automation_executions'

    @Column({ type: 'integer' })
    value: number;

    @Column({ length: 20 })
    period: string; // 'daily', 'monthly'

    @Column({ type: 'date' })
    @Index()
    date: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}
