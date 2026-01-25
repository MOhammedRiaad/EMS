import { Entity, Column, OneToMany } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { ClientWaiver } from './client-waiver.entity';

@Entity('waivers')
export class Waiver extends TenantScopedEntity {
    @Column({ length: 50 })
    version: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'is_active', default: false })
    isActive: boolean;

    @OneToMany(() => ClientWaiver, clientWaiver => clientWaiver.waiver)
    clientWaivers: ClientWaiver[];
}
