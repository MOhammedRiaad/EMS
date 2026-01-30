import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, PaymentMethod, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from './entities/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ProductsService } from './products.service';
import { ProductStock } from './entities/product-stock.entity';
import { Client } from '../clients/entities/client.entity';
import { Transaction, TransactionType, TransactionCategory } from '../packages/entities/transaction.entity';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

    constructor(
        @InjectRepository(Sale)
        private readonly saleRepo: Repository<Sale>,
        @InjectRepository(Client)
        private readonly clientRepo: Repository<Client>,
        private readonly productsService: ProductsService,
        private readonly dataSource: DataSource,
        private readonly auditService: AuditService,
    ) { }

    async createSale(tenantId: string, userId: string, dto: CreateSaleDto): Promise<Sale> {
        const savedSale = await this.dataSource.transaction(async (manager) => {
            // 1. Validate Client (if provided)
            let client: Client | null = null;
            if (dto.clientId) {
                client = await manager.findOne(Client, {
                    where: { id: dto.clientId, tenantId }
                });
                if (!client) throw new NotFoundException('Client not found');
            }

            // 2. Prepare Sale
            const sale = manager.create(Sale, {
                tenantId,
                studioId: dto.studioId,
                clientId: dto.clientId,
                soldBy: userId,
                paymentMethod: dto.paymentMethod,
                status: SaleStatus.COMPLETED,
                totalAmount: 0 // to be calculated
            });

            // 3. Process Items & Deduct Stock
            const saleItems: SaleItem[] = [];
            let total = 0;

            for (const itemDto of dto.items) {
                const product = await manager.findOne(Product, {
                    where: { id: itemDto.productId, tenantId }
                });
                if (!product) throw new NotFoundException(`Product ${itemDto.productId} not found`);

                // Check & Deduct Stock
                const stock = await manager.findOne(ProductStock, {
                    where: { productId: product.id, studioId: dto.studioId }
                });

                if (!stock || stock.quantity < itemDto.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${product.name}`);
                }

                stock.quantity -= itemDto.quantity;
                await manager.save(stock);

                // Create Item
                const subtotal = Number(product.price) * itemDto.quantity;
                total += subtotal;

                const saleItem = manager.create(SaleItem, {
                    tenantId,
                    product,
                    quantity: itemDto.quantity,
                    unitPrice: product.price,
                    subtotal: subtotal
                });
                saleItems.push(saleItem);
            }

            sale.totalAmount = total;
            sale.items = saleItems;

            // 4. Handle Payment & Transactions
            let transaction: Transaction | null = null;

            if (dto.paymentMethod === PaymentMethod.ON_ACCOUNT) {
                if (!client) throw new BadRequestException('Client required for On-Account payment');

                // Deduct balance (increase debt/reduce credit)
                client.creditBalance = Number(client.creditBalance) - total;
                await manager.save(client);

                // Create Transaction Record (Expense for Client / Income mechanism for Studio?)
                // Usually "On Account" means the client owes money. 
                // Existing logic: Type=EXPENSE (Client's perspective?), Category=RETAIL_SALE
                // Let's stick to the existing pattern or adjust if needed. 
                // However, for consistency with Financials:
                // If we want to show it in Studio Cash Flow, it should strictly be INCOME?
                // But if it's "On Account", cash hasn't entered the studio yet. It's Accounts Receivable.
                // The prompt asked: "any sales tranactions should reflect on studio main tranactions for increasein cash flow"
                // If it's On Account, it technically doesn't increase *Cash* Flow immediately, but it is Revenue.
                // For now, I will create a transaction as INCOME for Cash/Card, and maintain the existing EXPENSE (Debit) for On-Account 
                // OR add a separate transaction for the Sale itself?
                // Let's create a Transaction for ALL sales.

                transaction = manager.create(Transaction, {
                    tenantId,
                    studioId: dto.studioId,
                    clientId: client.id,
                    type: TransactionType.EXPENSE, // Debit from Client Account
                    amount: -total,
                    category: TransactionCategory.RETAIL_SALE,
                    description: `Retail Purchase (On Account)`,
                    createdBy: userId,
                    runningBalance: client.creditBalance
                });

            } else {
                // Cash / Card
                // This represents immediate Income for the studio.
                // Linking to client if selected allows tracking client spending.

                transaction = manager.create(Transaction, {
                    tenantId,
                    studioId: dto.studioId,
                    clientId: client?.id || undefined, // Optional link
                    type: TransactionType.INCOME,
                    amount: total,
                    category: TransactionCategory.RETAIL_SALE,
                    description: `Retail Sale (${dto.paymentMethod.toUpperCase()})`,
                    createdBy: userId,
                    // runningBalance: null - Not relevant for cash sales unless tracking studio cash box balance? 
                    // Studio entity doesn't seem to have a balance field in this context.
                });
            }

            const savedTx = await manager.save(Transaction, transaction);
            sale.transaction = savedTx;


            const savedSale = await manager.save(sale);

            // Audit Log - Note: manager doesn't track AuditService, calling it outside? 
            // AuditService uses its own repo. It is safer to call it after transaction commits, 
            // or pass manager if AuditService supported it.
            // For now, logging asynchronously/independently inside the service flow is acceptable if not strictly transactional.
            // However, since we are inside `dataSource.transaction`, `this.auditService` will use a separate connection/manager unless improved.
            // A simple await here is fine for now as Audit isn't blocking the business transaction success usually.

            return savedSale;
        });

        // Log after successful transaction
        // Since the return of transaction is savedSale, we can log here if we capture the ID.
        // But `this.dataSource.transaction` returns the result.

        // Refactoring to log inside the transaction block might need AuditService to accept a manager, 
        // OR we just accept that if audit fails, the transaction still succeeds (which is arguably better for availability).

        // Actually, let's just log "best effort" inside the transaction callback for simplicity in this codebase style.
        await this.auditService.log(
            tenantId,
            'CREATE_ORDER',
            'Sale',
            savedSale.id, // Captured from transaction result
            userId,
            { amount: savedSale.totalAmount, method: dto.paymentMethod }
        );

        return savedSale;
    }

    async getHistory(tenantId: string, studioId?: string): Promise<Sale[]> {
        const query = this.saleRepo.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.client', 'client')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .leftJoinAndSelect('sale.seller', 'seller')
            .where('sale.tenantId = :tenantId', { tenantId })
            .orderBy('sale.createdAt', 'DESC');

        if (studioId) {
            query.andWhere('sale.studioId = :studioId', { studioId });
        }

        return query.getMany();
    }

    async getTransactionHistory(tenantId: string, studioId?: string, startDate?: string, endDate?: string): Promise<Transaction[]> {
        const query = this.dataSource.getRepository(Transaction).createQueryBuilder('tx')
            .leftJoinAndSelect('tx.client', 'client')
            .leftJoinAndSelect('tx.creator', 'creator')
            .where('tx.tenantId = :tenantId', { tenantId })
            .andWhere('tx.category IN (:...categories)', { categories: [TransactionCategory.RETAIL_SALE, TransactionCategory.MANUAL_ADJUSTMENT] })
            .orderBy('tx.createdAt', 'DESC');

        if (studioId) {
            query.andWhere('tx.studioId = :studioId', { studioId });
        }

        if (startDate) {
            query.andWhere('tx.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
            query.andWhere('tx.createdAt <= :endDate', { endDate });
        }

        return query.getMany();
    }
}
