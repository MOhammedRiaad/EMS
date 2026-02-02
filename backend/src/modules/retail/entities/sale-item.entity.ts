import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Sale } from './sale.entity';
import { Product } from './product.entity';

@Entity('sale_items')
export class SaleItem extends TenantScopedEntityWithUpdate {
  @Column({ name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
