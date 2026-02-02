import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LeadActivity } from './lead-activity.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  TRIAL_BOOKED = 'trial_booked',
  CONVERTED = 'converted',
  LOST = 'lost',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Column({ nullable: true })
  source: string; // e.g., 'Website', 'Referral', 'Instagram'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assigned_to_id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'studio_id', nullable: true })
  studioId: string;

  @OneToMany(() => LeadActivity, (activity) => activity.lead)
  activities: LeadActivity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
