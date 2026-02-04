import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryColumn()
  key: string;

  @Column('text')
  value: string; // JSON stringified value

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['retention', 'security', 'maintenance', 'system', 'branding'],
    default: 'system',
  })
  category: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
