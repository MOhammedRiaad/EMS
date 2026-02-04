import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends BaseEntityWithUpdate {
  @Column({ length: 100, unique: true })
  key: string; // e.g., 'platform_owner', 'support_owner', 'tenant_owner', 'admin', 'coach', 'client'

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean; // Cannot be deleted if true

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null; // Null for platform roles, set for tenant-specific custom roles

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
