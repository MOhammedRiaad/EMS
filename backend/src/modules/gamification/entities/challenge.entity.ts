import { Entity, Column } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';

@Entity('challenges')
export class Challenge extends TenantScopedEntityWithUpdate {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  requirement: string; // e.g., 'sessions_3_week', 'try_new_coach'

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'reward_points', type: 'int', default: 0 })
  rewardPoints: number;
}
