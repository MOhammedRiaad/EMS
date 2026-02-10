import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('owner_audit_logs')
export class OwnerAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  @Index()
  ownerId: string;

  @Column({ length: 100 })
  @Index()
  action: string; // e.g., 'SUSPEND_TENANT', 'ENABLE_FEATURE', 'BROADCAST_MESSAGE', 'APPROVE_UPGRADE'

  @Column({ name: 'target_tenant_id', type: 'uuid', nullable: true })
  @Index()
  targetTenantId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
