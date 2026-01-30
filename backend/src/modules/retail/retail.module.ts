import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetailController } from './retail.controller';
import { ProductsService } from './products.service';
import { SalesService } from './sales.service';
import { Product } from './entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Client } from '../clients/entities/client.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductStock,
            Sale,
            SaleItem,
            Client
        ]),
        AuditModule
    ],
    controllers: [RetailController],
    providers: [ProductsService, SalesService],
    exports: [ProductsService, SalesService]
})
export class RetailModule { }
