import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';
import { Product } from './product.entity';

@Entity('product_stocks')
export class ProductStock extends TenantScopedEntityWithUpdate {
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'studio_id', nullable: true })
  studioId: string;

  @ManyToOne(() => Studio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studio_id' })
  studio: Studio;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
