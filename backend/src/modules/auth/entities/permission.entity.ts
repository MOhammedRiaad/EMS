import { Entity, Column } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';

@Entity('permissions')
export class Permission extends BaseEntityWithUpdate {
  @Column({ length: 100, unique: true })
  key: string; // e.g., 'tenant.create', 'feature.toggle', 'client.read', 'session.create'

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 50 })
  category: string; // 'owner', 'tenant', 'client', 'session', 'coach', 'marketing', etc.

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
