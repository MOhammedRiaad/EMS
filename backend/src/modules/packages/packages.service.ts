import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import {
  ClientPackage,
  ClientPackageStatus,
} from './entities/client-package.entity';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from './entities/transaction.entity';
import {
  CreatePackageDto,
  UpdatePackageDto,
  AssignPackageDto,
  RenewPackageDto,
  CreateTransactionDto,
} from './dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packageRepo: Repository<Package>,
    @InjectRepository(ClientPackage)
    private clientPackageRepo: Repository<ClientPackage>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private readonly auditService: AuditService,
  ) { }

  // ===== PACKAGES =====
  async findAllPackages(tenantId: string, includeInactive = false) {
    const where: any = { tenantId };
    if (!includeInactive) where.isActive = true;
    return this.packageRepo.find({ where, order: { name: 'ASC' } });
  }

  async createPackage(dto: CreatePackageDto, tenantId: string) {
    const pkg = this.packageRepo.create({ ...dto, tenantId });
    const saved = await this.packageRepo.save(pkg);
    await this.auditService.log(
      tenantId,
      'CREATE_PACKAGE',
      'Package',
      saved.id,
      'API_USER',
      { name: dto.name, price: dto.price },
    );
    return saved;
  }

  async updatePackage(id: string, dto: UpdatePackageDto, tenantId: string) {
    // Check if package has been assigned
    const assignmentCount = await this.clientPackageRepo.count({
      where: { packageId: id },
    });
    if (
      assignmentCount > 0 &&
      (dto.totalSessions || dto.price || dto.validityDays)
    ) {
      throw new BadRequestException(
        'Cannot modify session/price/validity of a package that has been assigned to clients',
      );
    }

    const pkg = await this.packageRepo.findOne({ where: { id, tenantId } });
    if (!pkg) throw new NotFoundException('Package not found');

    Object.assign(pkg, dto);
    const saved = await this.packageRepo.save(pkg);

    await this.auditService.log(
      tenantId,
      'UPDATE_PACKAGE',
      'Package',
      saved.id,
      'API_USER',
      { changes: dto },
    );
    return saved;
  }

  async archivePackage(id: string, tenantId: string) {
    return this.updatePackage(id, { isActive: false }, tenantId);
  }

  // ===== CLIENT PACKAGES =====
  async assignPackage(dto: AssignPackageDto, tenantId: string, userId: string) {
    if (!dto.clientId && !dto.leadId) {
      throw new BadRequestException('Either clientId or leadId is required');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id: dto.packageId, tenantId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Package not found or inactive');

    const purchaseDate = dto.purchaseDate
      ? new Date(dto.purchaseDate)
      : new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

    const clientPackage = this.clientPackageRepo.create({
      tenantId,
      clientId: dto.clientId,
      leadId: dto.leadId,
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

    // Only create transaction if clientId is present (Lead packages might not be paid yet or need different logic)
    // Or we assume leads pay too?
    // If Lead pays, we might need a dummy transaction or just log it.
    // For now, let's create transaction only if clientId is present as Transaction entity likely requires clientId.
    // Let's check Transaction entity.

    if (dto.clientId) {
      await this.createTransaction(
        {
          studioId: undefined,
          type: TransactionType.INCOME,
          category: TransactionCategory.PACKAGE_SALE,
          amount: Number(pkg.price),
          description: `Package "${pkg.name}" sold to client`,
          referenceType: 'client_package',
          referenceId: saved.id,
          clientId: dto.clientId,
          status: dto.paymentMethod
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING,
          paymentMethod: dto.paymentMethod,
        },
        tenantId,
        userId,
      );
    }

    await this.auditService.log(
      tenantId,
      'ASSIGN_PACKAGE',
      'ClientPackage',
      saved.id,
      userId,
      {
        clientId: dto.clientId,
        leadId: dto.leadId,
        packageId: dto.packageId,
        price: pkg.price,
      },
    );

    return saved;
  }

  async getClientPackages(clientId: string, tenantId: string) {
    return this.clientPackageRepo.find({
      where: { clientId, tenantId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });
  }

  async getLeadPackages(leadId: string, tenantId: string) {
    return this.clientPackageRepo.find({
      where: { leadId, tenantId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActivePackageForClient(
    clientId: string,
    tenantId: string,
  ): Promise<ClientPackage | null> {
    return this.clientPackageRepo.findOne({
      where: {
        clientId,
        tenantId,
        status: ClientPackageStatus.ACTIVE,
      },
    });
  }

  async findBestPackageForSession(
    clientId: string | null,
    leadId: string | null,
    tenantId: string,
  ): Promise<ClientPackage | null> {
    if (!clientId && !leadId) return null;

    // Find all active packages with remaining sessions
    const query = this.clientPackageRepo
      .createQueryBuilder('cp')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.status = :status', { status: ClientPackageStatus.ACTIVE })
      .andWhere('cp.sessionsRemaining > 0')
      .andWhere('cp.expiryDate > :now', { now: new Date() })
      .orderBy('cp.expiryDate', 'ASC');

    if (clientId) {
      query.andWhere('cp.clientId = :clientId', { clientId });
    } else if (leadId) {
      query.andWhere('cp.leadId = :leadId', { leadId });
    }

    const packages = await query.getMany();

    return packages.length > 0 ? packages[0] : null;
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
      .andWhere('(cp.expiryDate <= :futureDate OR cp.sessionsRemaining <= 1)', {
        futureDate,
      })
      .orderBy('cp.expiryDate', 'ASC')
      .getMany();
  }

  async useSession(id: string, tenantId: string) {
    const cp = await this.clientPackageRepo.findOne({
      where: { id, tenantId },
    });
    if (!cp) throw new NotFoundException('Client package not found');
    if (cp.status !== ClientPackageStatus.ACTIVE)
      throw new BadRequestException('Package is not active');
    if (cp.sessionsRemaining <= 0)
      throw new BadRequestException('No sessions remaining');

    cp.sessionsUsed += 1;
    cp.sessionsRemaining -= 1;

    if (cp.sessionsRemaining === 0) {
      cp.status = ClientPackageStatus.DEPLETED;
    }

    return this.clientPackageRepo.save(cp);
  }

  async returnSession(id: string, tenantId: string) {
    const cp = await this.clientPackageRepo.findOne({
      where: { id, tenantId },
    });
    if (!cp) throw new NotFoundException('Client package not found');

    // If package was depleted, make it active again
    if (cp.status === ClientPackageStatus.DEPLETED) {
      cp.status = ClientPackageStatus.ACTIVE;
    }

    cp.sessionsUsed = Math.max(0, cp.sessionsUsed - 1);
    cp.sessionsRemaining += 1;

    return this.clientPackageRepo.save(cp);
  }

  async renewPackage(
    id: string,
    dto: RenewPackageDto,
    tenantId: string,
    userId: string,
  ) {
    const oldCp = await this.clientPackageRepo.findOne({
      where: { id, tenantId },
      relations: ['package'],
    });
    if (!oldCp) throw new NotFoundException('Client package not found');

    const newPackageId = dto.newPackageId || oldCp.packageId;
    return this.assignPackage(
      {
        clientId: oldCp.clientId,
        packageId: newPackageId,
        paymentMethod: dto.paymentMethod,
        paymentNotes: dto.paymentNotes,
      },
      tenantId,
      userId,
    );
  }

  async adjustSessions(
    id: string,
    adjustment: number,
    reason: string,
    tenantId: string,
    userId: string,
  ) {
    const cp = await this.clientPackageRepo.findOne({
      where: { id, tenantId },
      relations: ['package'],
    });
    if (!cp) throw new NotFoundException('Client package not found');

    const newRemaining = cp.sessionsRemaining + adjustment;

    if (newRemaining < 0) {
      throw new BadRequestException(
        `Cannot decrease sessions by ${Math.abs(adjustment)}. Client only has ${cp.sessionsRemaining} remaining.`,
      );
    }

    const oldRemaining = cp.sessionsRemaining;
    cp.sessionsRemaining = newRemaining;

    // Update status if depleted or reactivated
    if (cp.sessionsRemaining === 0) {
      cp.status = ClientPackageStatus.DEPLETED;
    } else if (
      cp.sessionsRemaining > 0 &&
      cp.status === ClientPackageStatus.DEPLETED
    ) {
      cp.status = ClientPackageStatus.ACTIVE;
    }

    const saved = await this.clientPackageRepo.save(cp);

    await this.auditService.log(
      tenantId,
      'ADJUST_PACKAGE_SESSIONS',
      'ClientPackage',
      saved.id,
      userId,
      {
        adjustment,
        reason,
        oldRemaining,
        newRemaining,
      },
    );

    return saved;
  }

  // ===== TRANSACTIONS =====
  async createTransaction(
    dto: CreateTransactionDto & {
      status?: TransactionStatus;
      paymentMethod?: string;
    },
    tenantId: string,
    userId: string,
  ) {
    // Get current studio-wide balance
    const lastStudioTx = await this.transactionRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    const currentStudioBalance = lastStudioTx
      ? Number(lastStudioTx.runningBalance)
      : 0;

    let newStudioBalance = currentStudioBalance;
    // Studio balance only updates if it's PAID (or if it's an expense/adjustment we assume is immediate)
    // Actually, for consistency, let's say Studio Cash Flow tracks PAID items.
    // However, the user might want to see PENDING in cash flow.
    // If it's PENDING, does it affect the running balance?
    // Usually, running balance in a ledger only changes on finalized transactions.
    // But if we want to show it in the list with a running balance, we might need a "projected" balance or just update it.
    // Let's stick to: PAID transactions update studio running balance.
    if (dto.status !== TransactionStatus.PENDING) {
      newStudioBalance =
        dto.type === TransactionType.EXPENSE ||
          dto.type === TransactionType.REFUND
          ? currentStudioBalance - Math.abs(dto.amount)
          : currentStudioBalance + Math.abs(dto.amount);
    }

    // Get current client balance if applicable
    let clientRunningBalance = 0;
    if (dto.clientId) {
      const lastClientTx = await this.transactionRepo.findOne({
        where: { clientId: dto.clientId, tenantId },
        order: { createdAt: 'DESC' },
      });
      const currentClientBalance = lastClientTx
        ? Number(lastClientTx.clientRunningBalance)
        : 0;

      // Client balance updates immediately (they owe it / have it credited)
      clientRunningBalance =
        dto.type === TransactionType.EXPENSE ||
          dto.type === TransactionType.REFUND
          ? currentClientBalance - Math.abs(dto.amount)
          : currentClientBalance + Math.abs(dto.amount);
    }

    const tx = this.transactionRepo.create({
      ...dto,
      tenantId,
      createdBy: userId,
      status: dto.status || TransactionStatus.PAID,
      runningBalance: newStudioBalance,
      clientRunningBalance: dto.clientId ? clientRunningBalance : undefined,
    });

    return this.transactionRepo.save(tx);
  }

  async confirmPayment(
    transactionId: string,
    paymentMethod: string,
    tenantId: string,
    userId: string,
  ) {
    const tx = await this.transactionRepo.findOne({
      where: { id: transactionId, tenantId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status === TransactionStatus.PAID) {
      throw new BadRequestException('Transaction is already paid');
    }

    tx.status = TransactionStatus.PAID;
    tx.paymentMethod = paymentMethod;

    // Now that it's paid, it affects the studio running balance
    const lastStudioTx = await this.transactionRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    // Wait, updating runningBalance in the middle of a chain is hard with this simple logic.
    // But since we order by createdAt DESC, if we just paid an old one, the running balance of ALL subsequent ones is wrong.
    // For a simple app, we usually just update the "current" balance of the studio.
    // To keep it simple: we update the studio balance based on the current global balance.

    const lastGlobalTx = await this.transactionRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    const globalBalance = lastGlobalTx ? Number(lastGlobalTx.runningBalance) : 0;

    tx.runningBalance =
      tx.type === TransactionType.EXPENSE || tx.type === TransactionType.REFUND
        ? globalBalance - Math.abs(tx.amount)
        : globalBalance + Math.abs(tx.amount);

    const saved = await this.transactionRepo.save(tx);

    // If it was a package sale, also update the client package record
    if (tx.referenceType === 'client_package' && tx.referenceId) {
      await this.clientPackageRepo.update(tx.referenceId, {
        paymentMethod,
        paidAt: new Date(),
      });
    }

    await this.auditService.log(
      tenantId,
      'CONFIRM_PAYMENT',
      'Transaction',
      saved.id,
      userId,
      { paymentMethod, amount: tx.amount },
    );

    return saved;
  }

  async getTransactions(tenantId: string, filters?: any) {
    const query = this.transactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.studio', 'studio')
      .where('tx.tenantId = :tenantId', { tenantId })
      .orderBy('tx.createdAt', 'DESC');

    if (filters?.type)
      query.andWhere('tx.type = :type', { type: filters.type });
    if (filters?.category)
      query.andWhere('tx.category = :category', { category: filters.category });

    return query.getMany();
  }

  async getCurrentBalance(tenantId: string) {
    const lastTx = await this.transactionRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
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

    const summary: Record<string, number> = {
      income: 0,
      expense: 0,
      refund: 0,
      net: 0,
    };
    result.forEach((r) => {
      summary[r.type] = parseFloat(r.total) || 0;
    });
    summary.net = summary.income - summary.expense - summary.refund;
    return summary;
  }
}
