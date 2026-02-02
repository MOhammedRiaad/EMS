import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Coach } from './coach.entity';
import { User } from '../../auth/entities/user.entity';

export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

@Entity('coach_time_off_requests')
export class CoachTimeOffRequest extends TenantScopedEntity {
    @Column({ name: 'coach_id', type: 'uuid' })
    coachId: string;

    @Column({ name: 'start_date', type: 'timestamp with time zone' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamp with time zone' })
    endDate: Date;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    })
    status: TimeOffStatus;

    @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
    reviewedBy: string | null;

    @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
    reviewedAt: Date | null;

    @CreateDateColumn({ name: 'requested_at' })
    requestedAt: Date;

    @ManyToOne(() => Coach, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coach_id' })
    coach: Coach;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewer: User | null;
}
