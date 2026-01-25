import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TenantScopedEntityWithUpdate } from '../../../common/entities';
import { Studio } from '../../studios/entities/studio.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../auth/entities/user.entity';
import { SaleItem } from './sale-item.entity';
import { Transaction } from '../../packages/entities/transaction.entity';

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    ON_ACCOUNT = 'on_account',
    OTHER = 'other'
}

export enum SaleStatus {
    COMPLETED = 'completed',
    REFUNDED = 'refunded'
}

@Entity('sales')
export class Sale extends TenantScopedEntityWithUpdate {
    @Column({ name: 'studio_id', nullable: true })
    studioId: string;

    @ManyToOne(() => Studio)
    @JoinColumn({ name: 'studio_id' })
    studio: Studio;

    @Column({ name: 'client_id', nullable: true })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column({
        name: 'payment_method',
        type: 'varchar',
        length: 20
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: 'varchar',
        length: 20,
        default: SaleStatus.COMPLETED
    })
    status: SaleStatus;

    @Column({ name: 'sold_by' })
    soldBy: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sold_by' })
    seller: User;

    @Column({ name: 'transaction_id', nullable: true })
    transactionId: string;

    @ManyToOne(() => Transaction)
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;

    @OneToMany(() => SaleItem, item => item.sale, { cascade: true })
    items: SaleItem[];
}
