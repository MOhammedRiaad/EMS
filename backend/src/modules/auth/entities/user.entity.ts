import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';

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

    @Column({
        type: 'enum',
        enum: ['male', 'female', 'other', 'pnts'],
        default: 'pnts',
    })
    gender: 'male' | 'female' | 'other' | 'pnts';

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

    @Column({ name: 'failed_login_attempts', default: 0 })
    failedLoginAttempts: number;

    @Column({ name: 'lockout_until', type: 'timestamptz', nullable: true })
    lockoutUntil: Date | null;

    @Column({ name: 'is_two_factor_enabled', default: false })
    isTwoFactorEnabled: boolean;

    @Column({ name: 'two_factor_secret', type: 'varchar', nullable: true, select: false })
    @Exclude()
    twoFactorSecret: string | null;

    @Column({ name: 'password_reset_token', type: 'varchar', nullable: true, select: false })
    @Exclude()
    passwordResetToken: string | null;

    @Column({ name: 'password_reset_expires', type: 'timestamptz', nullable: true })
    passwordResetExpires: Date | null;

    @Column({ name: 'calendar_token', type: 'varchar', length: 64, nullable: true, select: false })
    @Exclude()
    calendarToken: string | null;

    @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        marketing: boolean;
    } | null;

    @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
    lastLoginAt: Date | null;

    @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @OneToOne('Client', 'user') // String based to avoid circular import issues or use simple lambda
    client: any; // Type as 'Client' but specific import might be tricky. 

    // Better to use import but standard circular dependency handling
    /*
    @OneToOne(() => Client, (client) => client.user)
    client: Client;
    */
    // Let's try simple import first, if it fails we revert.

    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
}
