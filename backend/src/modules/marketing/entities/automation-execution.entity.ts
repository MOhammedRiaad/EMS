import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

export enum AutomationExecutionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

@Entity('automation_executions')
export class AutomationExecution {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ruleId: string;

    @ManyToOne(() => AutomationRule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ruleId' })
    rule: AutomationRule;

    @Column()
    tenantId: string;

    // The ID of the entity that triggered this (e.g. clientId)
    @Column()
    entityId: string;

    @Column({ default: 0 })
    currentStepIndex: number;

    @Column({ type: 'timestamp' })
    nextRunAt: Date;

    @Column({
        type: 'enum',
        enum: AutomationExecutionStatus,
        default: AutomationExecutionStatus.PENDING
    })
    status: AutomationExecutionStatus;

    // Store context data like { leadId: '...', variables: {...} }
    @Column({ type: 'jsonb', nullable: true })
    context: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
