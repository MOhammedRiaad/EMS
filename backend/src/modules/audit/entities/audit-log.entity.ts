import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    @Column()
    action: string; // e.g., 'CREATE_CLIENT', 'UPDATE_SESSION'

    @Column()
    @Index()
    entityType: string; // e.g., 'Client', 'Session'

    @Column({ nullable: true })
    entityId: string;

    @Column()
    performedBy: string; // UserId or 'SYSTEM'

    @Column({ type: 'jsonb', nullable: true })
    details: any; // Context, Diff (old/new), IP, etc.

    @CreateDateColumn()
    @Index()
    createdAt: Date;

    @Column({ nullable: true })
    ipAddress: string;
}
