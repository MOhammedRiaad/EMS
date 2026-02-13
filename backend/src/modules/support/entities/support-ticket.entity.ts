import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { TicketMessage } from './ticket-message.entity';

export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum TicketCategory {
    BILLING = 'billing',
    TECHNICAL = 'technical',
    FEATURE_REQUEST = 'feature_request',
    OTHER = 'other'
}

@Entity()
export class SupportTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    subject: string;

    @Column('text')
    message: string; // Initial description

    @Column({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.OPEN
    })
    status: TicketStatus;

    @Column({
        type: 'enum',
        enum: TicketPriority,
        default: TicketPriority.MEDIUM
    })
    priority: TicketPriority;

    @Column({
        type: 'enum',
        enum: TicketCategory,
        default: TicketCategory.OTHER
    })
    category: TicketCategory;

    @Index()
    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Index()
    @Column()
    userId: string; // Creator

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => TicketMessage, (message) => message.ticket)
    messages: TicketMessage[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
