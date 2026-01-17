import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { ClientPackage, ClientPackageStatus } from './entities/client-package.entity';
import { Transaction, TransactionType, TransactionCategory } from './entities/transaction.entity';
import { CreatePackageDto, UpdatePackageDto, AssignPackageDto, RenewPackageDto, CreateTransactionDto } from './dto';

@Injectable()
export class PackagesService {
    constructor(
        @InjectRepository(Package)
        private packageRepo: Repository<Package>,
        @InjectRepository(ClientPackage)
        private clientPackageRepo: Repository<ClientPackage>,
        @InjectRepository(Transaction)
        private transactionRepo: Repository<Transaction>,
    ) { }

    // ===== PACKAGES =====
    async findAllPackages(tenantId: string, includeInactive = false) {
        const where: any = { tenantId };
        if (!includeInactive) where.isActive = true;
        return this.packageRepo.find({ where, order: { name: 'ASC' } });
    }

    async createPackage(dto: CreatePackageDto, tenantId: string) {
        const pkg = this.packageRepo.create({ ...dto, tenantId });
        return this.packageRepo.save(pkg);
    }

    async updatePackage(id: string, dto: UpdatePackageDto, tenantId: string) {
        // Check if package has been assigned
        const assignmentCount = await this.clientPackageRepo.count({ where: { packageId: id } });
        if (assignmentCount > 0 && (dto.totalSessions || dto.price || dto.validityDays)) {
            throw new BadRequestException('Cannot modify session/price/validity of a package that has been assigned to clients');
        }

        const pkg = await this.packageRepo.findOne({ where: { id, tenantId } });
        if (!pkg) throw new NotFoundException('Package not found');

        Object.assign(pkg, dto);
        return this.packageRepo.save(pkg);
    }

    async archivePackage(id: string, tenantId: string) {
        return this.updatePackage(id, { isActive: false }, tenantId);
    }

    // ===== CLIENT PACKAGES =====
    async assignPackage(dto: AssignPackageDto, tenantId: string, userId: string) {
        const pkg = await this.packageRepo.findOne({ where: { id: dto.packageId, tenantId, isActive: true } });
        if (!pkg) throw new NotFoundException('Package not found or inactive');

        const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : new Date();
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

        const clientPackage = this.clientPackageRepo.create({
            tenantId,
            clientId: dto.clientId,
            packageId: dto.packageId,
            purchaseDate,
            expiryDate,
            sessionsRemaining: pkg.totalSessions,
            sessionsUsed: 0,
            status: ClientPackageStatus.ACTIVE,
            paymentMethod: dto.paymentMethod,
            paymentNotes: dto.paymentNotes,
            paidAt: dto.paymentMethod ? new Date() : undefined,
        });

        const saved = await this.clientPackageRepo.save(clientPackage);

        // Create income transaction
        await this.createTransaction({
            studioId: undefined,
            type: TransactionType.INCOME,
            category: TransactionCategory.PACKAGE_SALE,
            amount: Number(pkg.price),
            description: `Package "${pkg.name}" sold to client`,
            referenceType: 'client_package',
            referenceId: saved.id,
        }, tenantId, userId);

        return saved;
    }

    async getClientPackages(clientId: string, tenantId: string) {
        return this.clientPackageRepo.find({
            where: { clientId, tenantId },
            relations: ['package'],
            order: { createdAt: 'DESC' }
        });
    }

    async getExpiringPackages(tenantId: string, daysAhead = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return this.clientPackageRepo
            .createQueryBuilder('cp')
            .leftJoinAndSelect('cp.client', 'client')
            .leftJoinAndSelect('cp.package', 'package')
            .where('cp.tenantId = :tenantId', { tenantId })
            .andWhere('cp.status = :status', { status: ClientPackageStatus.ACTIVE })
            .andWhere('(cp.expiryDate <= :futureDate OR cp.sessionsRemaining <= 1)', { futureDate })
            .orderBy('cp.expiryDate', 'ASC')
            .getMany();
    }

    async useSession(id: string, tenantId: string) {
        const cp = await this.clientPackageRepo.findOne({ where: { id, tenantId } });
        if (!cp) throw new NotFoundException('Client package not found');
        if (cp.status !== ClientPackageStatus.ACTIVE) throw new BadRequestException('Package is not active');
        if (cp.sessionsRemaining <= 0) throw new BadRequestException('No sessions remaining');

        cp.sessionsUsed += 1;
        cp.sessionsRemaining -= 1;

        if (cp.sessionsRemaining === 0) {
            cp.status = ClientPackageStatus.DEPLETED;
        }

        return this.clientPackageRepo.save(cp);
    }

    async renewPackage(id: string, dto: RenewPackageDto, tenantId: string, userId: string) {
        const oldCp = await this.clientPackageRepo.findOne({ where: { id, tenantId }, relations: ['package'] });
        if (!oldCp) throw new NotFoundException('Client package not found');

        const newPackageId = dto.newPackageId || oldCp.packageId;
        return this.assignPackage({
            clientId: oldCp.clientId,
            packageId: newPackageId,
            paymentMethod: dto.paymentMethod,
            paymentNotes: dto.paymentNotes,
        }, tenantId, userId);
    }

    // ===== TRANSACTIONS =====
    async createTransaction(dto: CreateTransactionDto, tenantId: string, userId: string) {
        // Get current balance
        const lastTx = await this.transactionRepo.findOne({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
        const currentBalance = lastTx ? Number(lastTx.runningBalance) : 0;
        const newBalance = dto.type === TransactionType.EXPENSE || dto.type === TransactionType.REFUND
            ? currentBalance - Math.abs(dto.amount)
            : currentBalance + Math.abs(dto.amount);

        const tx = this.transactionRepo.create({
            ...dto,
            tenantId,
            createdBy: userId,
            runningBalance: newBalance,
        });

        return this.transactionRepo.save(tx);
    }

    async getTransactions(tenantId: string, filters?: any) {
        const query = this.transactionRepo.createQueryBuilder('tx')
            .leftJoinAndSelect('tx.studio', 'studio')
            .where('tx.tenantId = :tenantId', { tenantId })
            .orderBy('tx.createdAt', 'DESC');

        if (filters?.type) query.andWhere('tx.type = :type', { type: filters.type });
        if (filters?.category) query.andWhere('tx.category = :category', { category: filters.category });

        return query.getMany();
    }

    async getCurrentBalance(tenantId: string) {
        const lastTx = await this.transactionRepo.findOne({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
        return { balance: lastTx ? Number(lastTx.runningBalance) : 0 };
    }

    async getSummary(tenantId: string) {
        const result = await this.transactionRepo
            .createQueryBuilder('tx')
            .select('tx.type', 'type')
            .addSelect('SUM(tx.amount)', 'total')
            .where('tx.tenantId = :tenantId', { tenantId })
            .groupBy('tx.type')
            .getRawMany();

        const summary: Record<string, number> = { income: 0, expense: 0, refund: 0, net: 0 };
        result.forEach(r => {
            summary[r.type] = parseFloat(r.total) || 0;
        });
        summary.net = summary.income - summary.expense - summary.refund;
        return summary;
    }
}
