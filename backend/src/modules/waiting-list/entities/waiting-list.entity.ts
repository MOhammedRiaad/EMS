import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Studio } from '../../studios/entities/studio.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { User } from '../../auth/entities/user.entity';

export enum WaitingListStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    NOTIFIED = 'notified',
    BOOKED = 'booked',
    CANCELLED = 'cancelled'
}

@Entity('waiting_list')
export class WaitingListEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ name: 'client_id' })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'session_id', nullable: true })
    sessionId: string;

    @ManyToOne(() => Session, { nullable: true })
    @JoinColumn({ name: 'session_id' })
    session: Session;

    @Column({ name: 'studio_id' })
    studioId: string;

    @ManyToOne(() => Studio)
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;

    @Column({ name: 'coach_id', nullable: true })
    coachId: string;

    @ManyToOne(() => Coach, { nullable: true })
    @JoinColumn({ name: 'coach_id' })
    coach: Coach;

    @Column({ name: 'preferred_date', type: 'date', nullable: true })
    preferredDate: string;

    @Column({ name: 'preferred_time_slot', nullable: true })
    preferredTimeSlot: string;

    @Column({
        type: 'enum',
        enum: WaitingListStatus,
        default: WaitingListStatus.PENDING
    })
    status: WaitingListStatus;

    @Column({ name: 'requires_approval', default: false })
    requiresApproval: boolean;

    @Column({ type: 'bigint', nullable: true })
    priority: number;

    @Column({ name: 'approved_by', nullable: true })
    approvedBy: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approver: User;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ name: 'notified_at', type: 'timestamp', nullable: true })
    notifiedAt: Date;

    @Column({ name: 'notification_method', nullable: true })
    notificationMethod: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
