import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Session } from './session.entity';
import { Client } from '../../clients/entities/client.entity';

@Entity('session_participants')
export class SessionParticipant extends TenantScopedEntity {
    @Column({ name: 'session_id', type: 'uuid' })
    sessionId: string;

    @ManyToOne(() => Session, session => session.participants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'session_id' })
    session: Session;

    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt: Date;

    @Column({
        type: 'enum',
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
    })
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
}
