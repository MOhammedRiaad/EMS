import { Entity, Column } from 'typeorm';
import { BaseEntityWithUpdate } from '../../../common/entities';

@Entity('feature_flags')
export class FeatureFlag extends BaseEntityWithUpdate {
  @Column({ length: 100, unique: true })
  key: string; // e.g., 'marketing.automation', 'retail.pos'

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 50 })
  category: string; // 'core', 'client', 'coach', 'finance', 'marketing', 'compliance'

  @Column({ name: 'default_enabled', default: true })
  defaultEnabled: boolean;

  @Column({ type: 'jsonb', default: [] })
  dependencies: string[]; // Other feature keys required for this feature to work

  @Column({ name: 'is_experimental', default: false })
  isExperimental: boolean;
}
