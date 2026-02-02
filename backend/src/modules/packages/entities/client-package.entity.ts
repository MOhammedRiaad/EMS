import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';
import { Package } from './package.entity';

export enum ClientPackageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
}

@Entity('client_packages')
export class ClientPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'package_id' })
  packageId: string;

  @ManyToOne(() => Package)
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate: Date;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'sessions_used', type: 'int', default: 0 })
  sessionsUsed: number;

  @Column({ name: 'sessions_remaining', type: 'int' })
  sessionsRemaining: number;

  @Column({ type: 'varchar', length: 20, default: ClientPackageStatus.ACTIVE })
  status: ClientPackageStatus;

  @Column({ name: 'payment_method', length: 20, nullable: true })
  paymentMethod: string;

  @Column({ name: 'payment_notes', type: 'text', nullable: true })
  paymentNotes: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
