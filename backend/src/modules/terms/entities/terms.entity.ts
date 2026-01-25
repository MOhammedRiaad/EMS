import { Entity, Column, OneToMany } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { TermsAcceptance } from './terms-acceptance.entity';

@Entity('terms_of_service')
export class TermsOfService extends TenantScopedEntity {
    @Column({ length: 50 })
    version: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'is_active', default: false })
    isActive: boolean;

    @Column({ name: 'published_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    publishedAt: Date;

    @OneToMany(() => TermsAcceptance, acceptance => acceptance.terms)
    acceptances: TermsAcceptance[];
}
