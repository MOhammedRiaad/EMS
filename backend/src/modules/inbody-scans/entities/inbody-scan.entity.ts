import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('inbody_scans')
export class InBodyScan extends TenantScopedEntityWithUpdate {
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'scan_date', type: 'date' })
  scanDate: Date;

  // Core Metrics
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number;

  @Column({ name: 'body_fat_mass', type: 'decimal', precision: 5, scale: 2 })
  bodyFatMass: number;

  @Column({
    name: 'skeletal_muscle_mass',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  skeletalMuscleMass: number;

  @Column({
    name: 'body_fat_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  bodyFatPercentage: number;

  // Segmental Analysis (Optional)
  @Column({
    name: 'right_arm_muscle',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  rightArmMuscle: number | null;

  @Column({
    name: 'left_arm_muscle',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  leftArmMuscle: number | null;

  @Column({
    name: 'trunk_muscle',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  trunkMuscle: number | null;

  @Column({
    name: 'right_leg_muscle',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  rightLegMuscle: number | null;

  @Column({
    name: 'left_leg_muscle',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  leftLegMuscle: number | null;

  // Additional Metrics
  @Column({ type: 'int', nullable: true })
  bmr: number | null; // Basal Metabolic Rate

  @Column({ name: 'visceral_fat_level', type: 'int', nullable: true })
  visceralFatLevel: number | null;

  @Column({
    name: 'body_water',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  bodyWater: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  protein: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  mineral: number | null;

  // Metadata
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'file_name', type: 'text', nullable: true })
  fileName: string | null;

  // Relations
  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
