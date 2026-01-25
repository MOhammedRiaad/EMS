import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { SalesService } from './sales.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { TenantId } from '../../common/decorators';

@ApiTags('retail')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('retail')
export class RetailController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly salesService: SalesService,
    ) { }

    // --- Products ---

    @Post('products')
    @ApiOperation({ summary: 'Create a new product' })
    createProduct(@Request() req: any, @Body() dto: CreateProductDto) {
        return this.productsService.create(req.user.tenantId, dto);
    }

    @Get('products')
    @ApiOperation({ summary: 'List all products' })
    findAllProducts(@Request() req: any) {
        return this.productsService.findAll(req.user.tenantId);
    }

    @Get('products/:id')
    @ApiOperation({ summary: 'Get a product by ID' })
    findOneProduct(@Request() req: any, @Param('id') id: string) {
        return this.productsService.findOne(req.user.tenantId, id);
    }

    @Put('products/:id')
    @ApiOperation({ summary: 'Update a product' })
    updateProduct(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(req.user.tenantId, id, dto);
    }

    @Delete('products/:id')
    @ApiOperation({ summary: 'Delete a product' })
    removeProduct(@Request() req: any, @Param('id') id: string) {
        return this.productsService.remove(req.user.tenantId, id);
    }

    // --- Stock ---

    @Get('stock/:studioId')
    @ApiOperation({ summary: 'Get all product stocks for a studio' })
    getStudioStock(@Request() req: any, @Param('studioId') studioId: string) {
        return this.productsService.getStudioStock(req.user.tenantId, studioId);
    }

    @Post('stock/:studioId/product/:productId')
    @ApiOperation({ summary: 'Update stock for a product in a studio' })
    updateStock(
        @Request() req: any,
        @Param('studioId') studioId: string,
        @Param('productId') productId: string,
        @Body() dto: UpdateStockDto
    ) {
        return this.productsService.updateStock(req.user.tenantId, studioId, productId, dto);
    }

    // --- Sales ---

    @Post('sales')
    @ApiOperation({ summary: 'Create a new sale (POS Transaction)' })
    createSale(@Request() req: any, @Body() dto: CreateSaleDto) {
        return this.salesService.createSale(req.user.tenantId, req.user.id, dto);
    }

    @Get('sales')
    @ApiOperation({ summary: 'Get sales history' })
    getSalesHistory(@Request() req: any, @Query('studioId') studioId?: string) {
        return this.salesService.getHistory(req.user.tenantId, studioId);
    }

    @Get('transactions')
    @ApiOperation({ summary: 'Get retail transaction history (POS Report)' })
    @ApiQuery({ name: 'studioId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getTransactionHistory(
        @TenantId() tenantId: string,
        @Query('studioId') studioId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.salesService.getTransactionHistory(tenantId, studioId, startDate, endDate);
    }
}
