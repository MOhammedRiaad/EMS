import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Tenant } from '../../tenants/entities/tenant.entity';

export type UserRole = 'tenant_owner' | 'admin' | 'coach' | 'client';

@Entity('users')
export class User extends TenantScopedEntityWithUpdate {
    @Column({ length: 255 })
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    @Exclude()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: ['tenant_owner', 'admin', 'coach', 'client'],
        default: 'client',
    })
    role: UserRole;

    @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
    firstName: string | null;

    @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
    lastName: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string | null;

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl: string | null;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column({ default: true })
    active: boolean;

    @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
    lastLoginAt: Date | null;

    @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
}
