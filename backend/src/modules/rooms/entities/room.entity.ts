import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';

@Entity('rooms')
export class Room extends TenantScopedEntity {
    @Column({ name: 'studio_id', type: 'uuid' })
    studioId: string;

    @Column({ length: 100 })
    name: string;

    @Column({ default: 1 })
    capacity: number;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: true })
    active: boolean;

    @ManyToOne(() => Studio, (studio) => studio.rooms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;
}
