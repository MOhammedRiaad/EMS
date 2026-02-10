import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity('feature_assignments')
@Index(['tenantId', 'featureKey'], { unique: true })
export class FeatureAssignment extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'feature_key', length: 100 })
  @Index()
  featureKey: string;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'enabled_at' })
  enabledAt: Date;

  @Column({ name: 'enabled_by', type: 'uuid' })
  enabledBy: string; // Owner user ID who made the change

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
