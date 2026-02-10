import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('tenants')
export class Tenant extends BaseEntityWithUpdate {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 50, default: 'starter' })
  plan: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode: string | null;

  @Column({ name: 'is_complete', default: false })
  isComplete: boolean;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  // Owner Dashboard Fields
  @Column({
    type: 'enum',
    enum: ['trial', 'active', 'suspended', 'blocked'],
    default: 'active',
  })
  status: 'trial' | 'active' | 'suspended' | 'blocked';

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt: Date | null;

  @Column({ name: 'suspended_reason', type: 'text', nullable: true })
  suspendedReason: string | null;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  @Column({ name: 'usage_stats', type: 'jsonb', nullable: true })
  usageStats: Record<string, any> | null; // Cached usage metrics, updated by cron job

  @Column({ name: 'owner_notes', type: 'text', nullable: true })
  ownerNotes: string | null;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean; // Automatically set when limits exceeded

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string | null; // e.g., "Session limit exceeded: 305/300"

  @OneToMany(() => Studio, (studio) => studio.tenant)
  studios: Studio[];

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
