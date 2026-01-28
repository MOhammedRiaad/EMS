import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../../auth/entities/user.entity';

export enum LeadActivityType {
    NOTE = 'note',
    EMAIL_SENT = 'email_sent',
    STATUS_CHANGED = 'status_changed',
    CALL = 'call',
    MEETING = 'meeting'
}

@Entity('lead_activities')
export class LeadActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Lead, lead => lead.activities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @Column()
    lead_id: string;

    @Column({
        type: 'enum',
        enum: LeadActivityType,
        default: LeadActivityType.NOTE
    })
    type: LeadActivityType;

    @Column({ type: 'text' })
    content: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ nullable: true })
    created_by_id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
