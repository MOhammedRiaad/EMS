import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';
import { Waiver } from './waiver.entity';

@Entity('client_waivers')
export class ClientWaiver extends TenantScopedEntity {
  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Waiver, (waiver) => waiver.clientWaivers)
  @JoinColumn({ name: 'waiver_id' })
  waiver: Waiver;

  @Column({ name: 'waiver_id', type: 'uuid' })
  waiverId: string;

  @Column({ name: 'signature_data', type: 'text' })
  signatureData: string;

  @Column({
    name: 'signed_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  signedAt: Date;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;
}
