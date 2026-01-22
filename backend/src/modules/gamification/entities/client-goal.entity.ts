import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';

export enum GoalType {
    WEIGHT = 'weight',
    BODY_FAT = 'body_fat',
    MUSCLE_MASS = 'muscle_mass',
}

export enum GoalStatus {
    ACTIVE = 'active',
    ACHIEVED = 'achieved',
    ABANDONED = 'abandoned',
}

@Entity('client_goals')
export class ClientGoal extends TenantScopedEntityWithUpdate {
    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @Column({
        type: 'enum',
        enum: GoalType,
        name: 'goal_type',
    })
    goalType: GoalType;

    @Column({ name: 'target_value', type: 'decimal', precision: 10, scale: 2 })
    targetValue: number;

    @Column({ name: 'start_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
    startValue: number | null;

    @Column({ name: 'deadline', type: 'date' })
    deadline: Date;

    @Column({
        type: 'enum',
        enum: GoalStatus,
        default: GoalStatus.ACTIVE,
    })
    status: GoalStatus;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_id' })
    client: Client;
}
