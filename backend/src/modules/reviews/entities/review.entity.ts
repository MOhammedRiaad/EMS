import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Session } from '../../sessions/entities/session.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';

@Entity('client_session_reviews')
export class ClientSessionReview extends TenantScopedEntity {
    @Column({ name: 'session_id', type: 'uuid' })
    sessionId: string;

    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @Column({ name: 'coach_id', type: 'uuid' })
    coachId: string;

    @Column({ type: 'int' })
    rating: number; // 1-5

    @Column({ type: 'text', nullable: true })
    comments: string | null;

    @Column({ name: 'visible_to_admins', type: 'boolean', default: true })
    visibleToAdmins: boolean;

    @OneToOne(() => Session)
    @JoinColumn({ name: 'session_id' })
    session: Session;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @ManyToOne(() => Coach)
    @JoinColumn({ name: 'coach_id' })
    coach: Coach;
}
