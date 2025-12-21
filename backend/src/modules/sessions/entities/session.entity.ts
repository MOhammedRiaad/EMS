import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Client } from '../../clients/entities/client.entity';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

@Entity('sessions')
export class Session extends TenantScopedEntityWithUpdate {
    @Column({ name: 'studio_id', type: 'uuid' })
    studioId: string;

    @Column({ name: 'room_id', type: 'uuid' })
    roomId: string;

    @Column({ name: 'coach_id', type: 'uuid' })
    coachId: string;

    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @Column({ name: 'ems_device_id', type: 'uuid', nullable: true })
    emsDeviceId: string | null;

    @Column({ name: 'start_time', type: 'timestamptz' })
    startTime: Date;

    @Column({ name: 'end_time', type: 'timestamptz' })
    endTime: Date;

    @Column({ name: 'program_type', type: 'varchar', length: 100, nullable: true })
    programType: string | null;

    @Column({ name: 'intensity_level', type: 'int', nullable: true })
    intensityLevel: number | null;

    @Column({
        type: 'enum',
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
    })
    status: SessionStatus;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
    cancelledAt: Date | null;

    @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
    cancelledReason: string | null;

    @ManyToOne(() => Studio, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;

    @ManyToOne(() => Room, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => Coach, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'coach_id' })
    coach: Coach;

    @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'client_id' })
    client: Client;
}
