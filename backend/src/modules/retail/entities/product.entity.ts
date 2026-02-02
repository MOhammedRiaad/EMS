import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';

export enum ProductCategory {
  BEVERAGE = 'beverage',
  SUPPLEMENT = 'supplement',
  GEAR = 'gear',
  CLOTHING = 'clothing',
  OTHER = 'other',
}

@Entity('products')
export class Product extends TenantScopedEntityWithUpdate {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column({ default: true })
  isActive: boolean;

  stock?: any; // For query mapping
}
