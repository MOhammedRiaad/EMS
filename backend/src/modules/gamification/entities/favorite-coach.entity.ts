import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';

@Entity('favorite_coaches')
export class FavoriteCoach extends TenantScopedEntity {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId: string;

  @CreateDateColumn({ name: 'favorited_at', type: 'timestamptz' })
  favoritedAt: Date;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Coach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;
}
