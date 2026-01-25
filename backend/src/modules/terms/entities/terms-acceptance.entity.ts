import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';
import { TermsOfService } from './terms.entity';

@Entity('terms_acceptance')
export class TermsAcceptance extends TenantScopedEntity {
    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'terms_id', type: 'uuid' })
    termsId: string;

    @ManyToOne(() => TermsOfService, terms => terms.acceptances)
    @JoinColumn({ name: 'terms_id' })
    terms: TermsOfService;

    @Column({ name: 'accepted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    acceptedAt: Date;

    @Column({ name: 'ip_address', length: 45, nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;
}
