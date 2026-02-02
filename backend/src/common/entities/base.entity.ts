import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

export abstract class BaseEntityWithUpdate extends BaseEntity {
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;
}

export abstract class TenantScopedEntityWithUpdate extends BaseEntityWithUpdate {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;
}
