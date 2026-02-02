import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { User } from '../../auth/entities/user.entity';
import { Studio } from '../../studios/entities/studio.entity';
import { Session } from '../../sessions/entities/session.entity';

export type ClientStatus = 'active' | 'inactive' | 'suspended';

@Entity('clients')
export class Client extends TenantScopedEntityWithUpdate {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'studio_id', type: 'uuid', nullable: true })
  studioId: string | null;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: ClientStatus;

  @Column({
    name: 'consent_flags',
    type: 'jsonb',
    default: { marketing: false, data_processing: true },
  })
  consentFlags: { marketing: boolean; data_processing: boolean };

  @Column({
    name: 'privacy_preferences',
    type: 'jsonb',
    default: { leaderboard_visible: true, activity_feed_visible: true },
  })
  privacyPreferences: {
    leaderboard_visible: boolean;
    activity_feed_visible: boolean;
  };

  @Column({ name: 'health_notes', type: 'text', nullable: true })
  healthNotes: string | null;

  @Column({ name: 'health_goals', type: 'jsonb', default: [] })
  healthGoals: Array<{
    id: string;
    goal: string;
    targetDate?: string;
    completed: boolean;
  }>;

  @Column({
    name: 'medical_history',
    type: 'jsonb',
    default: { allergies: [], injuries: [], conditions: [] },
  })
  medicalHistory: {
    allergies: string[];
    injuries: string[];
    conditions: string[];
    custom?: any;
  };

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @OneToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => Studio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studio_id' })
  studio: Studio | null;

  @Column({
    name: 'credit_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  creditBalance: number;

  @OneToMany(() => Session, (session) => session.client)
  sessions: Session[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
