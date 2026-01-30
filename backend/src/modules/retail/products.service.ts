import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(ProductStock)
        private readonly stockRepo: Repository<ProductStock>,
        private readonly auditService: AuditService,
    ) { }

    async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
        const product = this.productRepo.create({
            ...dto,
            tenantId,
        });
        const savedProduct = await this.productRepo.save(product);
        await this.auditService.log(
            tenantId,
            'CREATE_PRODUCT',
            'Product',
            savedProduct.id,
            'API_USER',
            { name: dto.name, price: dto.price }
        );
        return savedProduct;
    }

    async findAll(tenantId: string): Promise<Product[]> {
        return this.productRepo.find({
            where: { tenantId },
            order: { name: 'ASC' },
        });
    }

    async findOne(tenantId: string, id: string): Promise<Product> {
        const product = await this.productRepo.findOne({
            where: { id, tenantId },
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(tenantId, id);

        await this.productRepo.update(id, dto);

        await this.auditService.log(
            tenantId,
            'UPDATE_PRODUCT',
            'Product',
            id,
            'API_USER',
            { changes: dto }
        );

        return this.findOne(tenantId, id);
    }

    async remove(tenantId: string, id: string): Promise<void> {
        const result = await this.productRepo.delete({ id, tenantId });
        if (result.affected === 0) throw new NotFoundException('Product not found');
    }

    // Stock Management (Studio Level)

    async getStudioStock(tenantId: string, studioId: string): Promise<any[]> {
        const products = await this.productRepo.find({
            where: { tenantId },
            order: { name: 'ASC' },
        });

        const stocks = await this.stockRepo.find({
            where: { studioId },
        });

        const stockMap = new Map(stocks.map(s => [s.productId, s.quantity]));

        return products.map((p) => ({
            ...p,
            stockQuantity: stockMap.get(p.id) || 0,
        }));
    }

    async updateStock(tenantId: string, studioId: string, productId: string, dto: UpdateStockDto): Promise<ProductStock> {
        // Verify product belongs to tenant
        await this.findOne(tenantId, productId);

        let stock = await this.stockRepo.findOne({
            where: { studioId, productId },
        });

        if (!stock) {
            stock = this.stockRepo.create({
                tenantId, // Inherited from tenant-scoped entity, though usually inferred
                studioId,
                productId,
                quantity: 0,
            });
        }

        if (dto.operation === 'set') {
            stock.quantity = dto.quantity;
        } else if (dto.operation === 'add') {
            stock.quantity += dto.quantity;
        } else if (dto.operation === 'subtract') {
            stock.quantity -= dto.quantity;
        }

        if (stock.quantity < 0) stock.quantity = 0; // Prevent negative stock for now

        const savedStock = await this.stockRepo.save(stock);

        await this.auditService.log(
            tenantId,
            'UPDATE_STOCK',
            'ProductStock',
            savedStock.id,
            'API_USER',
            { productId, studioId, operation: dto.operation, quantity: dto.quantity, newTotal: savedStock.quantity }
        );

        return savedStock;
    }
}
