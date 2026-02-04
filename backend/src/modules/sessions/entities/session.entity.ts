import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Client } from '../../clients/entities/client.entity';
import { ClientSessionReview } from '../../reviews/entities/review.entity';
import { SessionParticipant } from './session-participant.entity';
import { ClientPackage } from '../../packages/entities/client-package.entity';

export type SessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

@Entity('sessions')
export class Session extends TenantScopedEntityWithUpdate {
  @Column({ name: 'studio_id', type: 'uuid' })
  studioId: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ name: 'ems_device_id', type: 'uuid', nullable: true })
  emsDeviceId: string | null;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    name: 'program_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  programType: string | null;

  @Column({ name: 'intensity_level', type: 'int', nullable: true })
  intensityLevel: number | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  })
  status: SessionStatus;

  @Column({
    type: 'enum',
    enum: ['individual', 'group'],
    default: 'individual',
  })
  type: 'individual' | 'group';

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null;

  // Recurrence fields
  @Column({
    name: 'recurrence_pattern',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  recurrencePattern:
    | 'daily'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'variable'
    | null;

  @Column({ name: 'recurrence_end_date', type: 'date', nullable: true })
  recurrenceEndDate: Date | null;

  @Column({ name: 'recurrence_days', type: 'simple-array', nullable: true })
  recurrenceDays: number[] | null; // Array of weekday numbers: 0=Sunday, 1=Monday, etc.

  @Column({ name: 'parent_session_id', type: 'uuid', nullable: true })
  parentSessionId: string | null;

  @Column({ name: 'is_recurring_parent', type: 'boolean', default: false })
  isRecurringParent: boolean;

  @ManyToOne(() => Studio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studio_id' })
  studio: Studio;

  @ManyToOne(() => Room, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Coach, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'coach_id' })
  coach: Coach;

  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => SessionParticipant, (participant) => participant.session)
  participants: SessionParticipant[];

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt: Date | null;

  @OneToOne(() => ClientSessionReview, (review) => review.session)
  review: ClientSessionReview;

  @Column({ name: 'client_package_id', type: 'uuid', nullable: true })
  clientPackageId: string | null;

  @ManyToOne(() => ClientPackage, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_package_id' })
  clientPackage: ClientPackage;

  @Column({ name: 'booked_start_time', type: 'timestamptz', nullable: true })
  bookedStartTime: Date | null;

  @Column({ name: 'booked_end_time', type: 'timestamptz', nullable: true })
  bookedEndTime: Date | null;
}
