import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto, AssignPackageDto, RenewPackageDto, CreateTransactionDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller()
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    // ===== PACKAGES =====
    @Get('packages')
    @ApiOperation({ summary: 'List all packages' })
    findAllPackages(@TenantId() tenantId: string, @Query('includeInactive') includeInactive?: string) {
        return this.packagesService.findAllPackages(tenantId, includeInactive === 'true');
    }

    @Post('packages')
    @ApiOperation({ summary: 'Create package' })
    createPackage(@Body() dto: CreatePackageDto, @TenantId() tenantId: string) {
        return this.packagesService.createPackage(dto, tenantId);
    }

    @Patch('packages/:id')
    @ApiOperation({ summary: 'Update package (restricted if assigned)' })
    updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto, @TenantId() tenantId: string) {
        return this.packagesService.updatePackage(id, dto, tenantId);
    }

    @Patch('packages/:id/archive')
    @ApiOperation({ summary: 'Archive package' })
    archivePackage(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.packagesService.archivePackage(id, tenantId);
    }

    // ===== CLIENT PACKAGES =====
    @Get('client-packages')
    @ApiOperation({ summary: 'List all client packages' })
    findAllClientPackages(@TenantId() tenantId: string) {
        return this.packagesService.getExpiringPackages(tenantId, 365); // All within a year
    }

    @Get('client-packages/expiring')
    @ApiOperation({ summary: 'Get expiring packages (alert)' })
    getExpiringPackages(@TenantId() tenantId: string, @Query('days') days?: string) {
        return this.packagesService.getExpiringPackages(tenantId, days ? parseInt(days) : 7);
    }

    @Get('client-packages/client/:clientId')
    @ApiOperation({ summary: 'Get packages for a client' })
    getClientPackages(@Param('clientId') clientId: string, @TenantId() tenantId: string) {
        return this.packagesService.getClientPackages(clientId, tenantId);
    }

    @Post('client-packages')
    @ApiOperation({ summary: 'Assign package to client' })
    assignPackage(@Body() dto: AssignPackageDto, @TenantId() tenantId: string, @Request() req: any) {
        return this.packagesService.assignPackage(dto, tenantId, req.user.id);
    }

    @Patch('client-packages/:id/use-session')
    @ApiOperation({ summary: 'Use one session from package' })
    useSession(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.packagesService.useSession(id, tenantId);
    }

    @Post('client-packages/:id/renew')
    @ApiOperation({ summary: 'Renew package (same or different)' })
    renewPackage(@Param('id') id: string, @Body() dto: RenewPackageDto, @TenantId() tenantId: string, @Request() req: any) {
        return this.packagesService.renewPackage(id, dto, tenantId, req.user.id);
    }

    // ===== TRANSACTIONS =====
    @Get('transactions')
    @ApiOperation({ summary: 'List all transactions' })
    findAllTransactions(@TenantId() tenantId: string, @Query() filters: any) {
        return this.packagesService.getTransactions(tenantId, filters);
    }

    @Get('transactions/balance')
    @ApiOperation({ summary: 'Get current cash balance' })
    getBalance(@TenantId() tenantId: string) {
        return this.packagesService.getCurrentBalance(tenantId);
    }

    @Get('transactions/summary')
    @ApiOperation({ summary: 'Get income/expense summary' })
    getSummary(@TenantId() tenantId: string) {
        return this.packagesService.getSummary(tenantId);
    }

    @Post('transactions')
    @ApiOperation({ summary: 'Record manual transaction' })
    createTransaction(@Body() dto: CreateTransactionDto, @TenantId() tenantId: string, @Request() req: any) {
        return this.packagesService.createTransaction(dto, tenantId, req.user.id);
    }
}
