import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AnnouncementTargetType {
  ALL = 'all',
  CLIENTS = 'clients',
  COACHES = 'coaches',
  SPECIFIC_USERS = 'specific_users',
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: AnnouncementTargetType,
    default: AnnouncementTargetType.ALL,
  })
  targetType: AnnouncementTargetType;

  @Column({ type: 'jsonb', nullable: true })
  targetUserIds: string[];

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
