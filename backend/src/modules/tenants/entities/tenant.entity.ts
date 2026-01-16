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

    @OneToMany(() => Studio, (studio) => studio.tenant)
    studios: Studio[];

    @OneToMany(() => User, (user) => user.tenant)
    users: User[];
}
