import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('studios')
export class Studio extends TenantScopedEntityWithUpdate {
    @Column({ length: 255 })
    name: string;

    @Column({ length: 100 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    address: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    country: string | null;

    @Column({ length: 50, default: 'Europe/Berlin' })
    timezone: string;

    @Column({ name: 'opening_hours', type: 'jsonb', default: {} })
    openingHours: Record<string, { open: string; close: string } | null>;

    @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
    contactEmail: string | null;

    @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
    contactPhone: string | null;

    @Column({ default: true })
    active: boolean;

    @ManyToOne(() => Tenant, (tenant) => tenant.studios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @OneToMany(() => Room, (room) => room.studio)
    rooms: Room[];
}
