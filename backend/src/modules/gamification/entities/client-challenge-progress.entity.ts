import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';
import { Challenge } from './challenge.entity';

@Entity('client_challenge_progress')
export class ClientChallengeProgress extends TenantScopedEntityWithUpdate {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'challenge_id', type: 'uuid' })
  challengeId: string;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0-100%

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'reward_claimed', type: 'boolean', default: false })
  rewardClaimed: boolean;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;
}
