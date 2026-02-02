import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';

export type DeviceStatus = 'available' | 'in_use' | 'maintenance';

@Entity('ems_devices')
export class EmsDevice extends TenantScopedEntity {
  @Column({ name: 'studio_id', type: 'uuid' })
  studioId: string;

  @Column({ length: 100 })
  label: string;

  @Column({
    name: 'serial_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  serialNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({
    type: 'enum',
    enum: ['available', 'in_use', 'maintenance'],
    default: 'available',
  })
  status: DeviceStatus;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
  lastMaintenanceDate: Date | null;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Studio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studio_id' })
  studio: Studio;
}
