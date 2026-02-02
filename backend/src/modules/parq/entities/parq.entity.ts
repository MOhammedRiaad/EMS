import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';

@Entity('parq_responses')
export class ParqResponse extends TenantScopedEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'jsonb' })
  responses: Record<string, boolean>;

  @Column({ name: 'has_risk', default: false })
  hasRisk: boolean;

  @Column({ name: 'signature_data', type: 'text' })
  signatureData: string;

  @Column({
    name: 'signed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  signedAt: Date;
}
