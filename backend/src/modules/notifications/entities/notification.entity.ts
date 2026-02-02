import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tenantId: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: 'info' })
  type: string; // info, success, warning, error

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
