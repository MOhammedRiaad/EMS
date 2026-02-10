import { Entity, Column } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';

export interface PlanLimits {
  maxClients: number;
  maxCoaches: number;
  maxSessionsPerMonth: number;
  smsAllowance: number;
  emailAllowance: number;
  storageGB: number;
}

@Entity('plans')
export class Plan extends BaseEntityWithUpdate {
  @Column({ length: 50, unique: true })
  key: string; // 'trial', 'starter', 'pro', 'enterprise'

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb' })
  limits: PlanLimits;

  @Column({ type: 'jsonb', default: [] })
  features: string[]; // Feature keys included in this plan

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null; // Monthly price (for future billing integration)
}
