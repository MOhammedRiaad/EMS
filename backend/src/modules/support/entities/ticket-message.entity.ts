import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class TicketMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    ticketId: string;

    @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticketId' })
    ticket: SupportTicket;

    @Index()
    @Column()
    userId: string; // Sender

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('text')
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
