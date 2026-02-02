import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from './client.entity';

@Entity('client_progress_photos')
export class ClientProgressPhoto extends TenantScopedEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'photo_url', type: 'text' })
  photoUrl: string;

  @Column({
    name: 'taken_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  takenAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: 'front' | 'back' | 'side' | 'other';

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
