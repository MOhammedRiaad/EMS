import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';
import { ClientPackage, ClientPackageStatus } from './entities/client-package.entity';
import { Transaction, TransactionType, TransactionCategory } from './entities/transaction.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PackagesService', () => {
    let service: PackagesService;
    let packageRepo: jest.Mocked<Repository<Package>>;
    let clientPackageRepo: jest.Mocked<Repository<ClientPackage>>;
    let transactionRepo: jest.Mocked<Repository<Transaction>>;

    const mockPackage = {
        id: 'pkg-123',
        tenantId: 'tenant-123',
        name: '10 Session Pack',
        totalSessions: 10,
        validityDays: 90,
        price: 500.00,
        isActive: true,
    } as Package;

    const mockClientPackage = {
        id: 'cp-123',
        tenantId: 'tenant-123',
        clientId: 'client-123',
        packageId: 'pkg-123',
        sessionsRemaining: 5,
        sessionsUsed: 5,
        status: ClientPackageStatus.ACTIVE,
        expiryDate: new Date('2026-04-01'),
        purchaseDate: new Date('2026-01-01'),
        package: mockPackage,
    } as ClientPackage;

    const mockTransaction = {
        id: 'tx-123',
        tenantId: 'tenant-123',
        type: TransactionType.INCOME,
        category: TransactionCategory.PACKAGE_SALE,
        amount: 500,
        runningBalance: 500,
    } as Transaction;

    const createMockQueryBuilder = () => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getRawMany: jest.fn().mockResolvedValue([]),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PackagesService,
                {
                    provide: getRepositoryToken(Package),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(ClientPackage),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Transaction),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PackagesService>(PackagesService);
        packageRepo = module.get(getRepositoryToken(Package));
        clientPackageRepo = module.get(getRepositoryToken(ClientPackage));
        transactionRepo = module.get(getRepositoryToken(Transaction));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllPackages', () => {
        it('should return active packages by default', async () => {
            packageRepo.find.mockResolvedValue([mockPackage]);

            const result = await service.findAllPackages('tenant-123');

            expect(packageRepo.find).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-123', isActive: true },
                order: { name: 'ASC' },
            });
            expect(result).toEqual([mockPackage]);
        });

        it('should include inactive packages when requested', async () => {
            packageRepo.find.mockResolvedValue([mockPackage]);

            await service.findAllPackages('tenant-123', true);

            expect(packageRepo.find).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-123' },
                order: { name: 'ASC' },
            });
        });
    });

    describe('createPackage', () => {
        const createDto = {
            name: '10 Session Pack',
            totalSessions: 10,
            validityDays: 90,
            price: 500,
        };

        it('should create a package successfully', async () => {
            packageRepo.create.mockReturnValue(mockPackage);
            packageRepo.save.mockResolvedValue(mockPackage);

            const result = await service.createPackage(createDto, 'tenant-123');

            expect(packageRepo.create).toHaveBeenCalledWith({
                ...createDto,
                tenantId: 'tenant-123',
            });
            expect(packageRepo.save).toHaveBeenCalled();
            expect(result).toBe(mockPackage);
        });
    });

    describe('updatePackage', () => {
        const updateDto = { name: 'Updated Package Name' };

        it('should update package successfully', async () => {
            clientPackageRepo.count.mockResolvedValue(0);
            packageRepo.findOne.mockResolvedValue(mockPackage);
            packageRepo.save.mockResolvedValue({ ...mockPackage, ...updateDto });

            const result = await service.updatePackage('pkg-123', updateDto, 'tenant-123');

            expect(result.name).toBe(updateDto.name);
        });

        it('should throw NotFoundException if package not found', async () => {
            clientPackageRepo.count.mockResolvedValue(0);
            packageRepo.findOne.mockResolvedValue(null);

            await expect(
                service.updatePackage('pkg-123', updateDto, 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when modifying assigned package sessions', async () => {
            clientPackageRepo.count.mockResolvedValue(5);

            await expect(
                service.updatePackage('pkg-123', { totalSessions: 15 }, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when modifying assigned package price', async () => {
            clientPackageRepo.count.mockResolvedValue(5);

            await expect(
                service.updatePackage('pkg-123', { price: 600 }, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('assignPackage', () => {
        const assignDto = {
            clientId: 'client-123',
            packageId: 'pkg-123',
            paymentMethod: 'cash',
        };

        it('should assign package to client', async () => {
            packageRepo.findOne.mockResolvedValue(mockPackage);
            clientPackageRepo.create.mockReturnValue(mockClientPackage);
            clientPackageRepo.save.mockResolvedValue(mockClientPackage);
            transactionRepo.findOne.mockResolvedValue(null);
            transactionRepo.create.mockReturnValue(mockTransaction);
            transactionRepo.save.mockResolvedValue(mockTransaction);

            const result = await service.assignPackage(assignDto, 'tenant-123', 'user-123');

            expect(clientPackageRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: 'tenant-123',
                    clientId: 'client-123',
                    packageId: 'pkg-123',
                    sessionsRemaining: mockPackage.totalSessions,
                })
            );
            expect(result).toBe(mockClientPackage);
        });

        it('should throw NotFoundException if package not found', async () => {
            packageRepo.findOne.mockResolvedValue(null);

            await expect(
                service.assignPackage(assignDto, 'tenant-123', 'user-123')
            ).rejects.toThrow(NotFoundException);
        });

        it('should create income transaction when assigning package', async () => {
            packageRepo.findOne.mockResolvedValue(mockPackage);
            clientPackageRepo.create.mockReturnValue(mockClientPackage);
            clientPackageRepo.save.mockResolvedValue(mockClientPackage);
            transactionRepo.findOne.mockResolvedValue(null);
            transactionRepo.create.mockReturnValue(mockTransaction);
            transactionRepo.save.mockResolvedValue(mockTransaction);

            await service.assignPackage(assignDto, 'tenant-123', 'user-123');

            expect(transactionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: TransactionType.INCOME,
                    category: TransactionCategory.PACKAGE_SALE,
                    amount: mockPackage.price,
                })
            );
        });
    });

    describe('useSession', () => {
        it('should deduct one session from client package', async () => {
            const cp = { ...mockClientPackage, sessionsRemaining: 5 };
            clientPackageRepo.findOne.mockResolvedValue(cp);
            clientPackageRepo.save.mockResolvedValue({
                ...cp,
                sessionsRemaining: 4,
                sessionsUsed: 6,
            });

            const result = await service.useSession('cp-123', 'tenant-123');

            expect(clientPackageRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionsRemaining: 4,
                    sessionsUsed: 6,
                })
            );
        });

        it('should throw NotFoundException if client package not found', async () => {
            clientPackageRepo.findOne.mockResolvedValue(null);

            await expect(
                service.useSession('cp-123', 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if no sessions remaining', async () => {
            clientPackageRepo.findOne.mockResolvedValue({
                ...mockClientPackage,
                sessionsRemaining: 0,
            });

            await expect(
                service.useSession('cp-123', 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if package not active', async () => {
            clientPackageRepo.findOne.mockResolvedValue({
                ...mockClientPackage,
                status: ClientPackageStatus.EXPIRED,
            });

            await expect(
                service.useSession('cp-123', 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });

        it('should set status to DEPLETED when last session used', async () => {
            const cp = { ...mockClientPackage, sessionsRemaining: 1 };
            clientPackageRepo.findOne.mockResolvedValue(cp);
            clientPackageRepo.save.mockImplementation(async (entity) => entity as ClientPackage);

            await service.useSession('cp-123', 'tenant-123');

            expect(clientPackageRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionsRemaining: 0,
                    status: ClientPackageStatus.DEPLETED,
                })
            );
        });
    });

    describe('getClientPackages', () => {
        it('should return client packages with relations', async () => {
            clientPackageRepo.find.mockResolvedValue([mockClientPackage]);

            const result = await service.getClientPackages('client-123', 'tenant-123');

            expect(clientPackageRepo.find).toHaveBeenCalledWith({
                where: { clientId: 'client-123', tenantId: 'tenant-123' },
                relations: ['package'],
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual([mockClientPackage]);
        });
    });

    describe('getActivePackageForClient', () => {
        it('should return active package for client', async () => {
            clientPackageRepo.findOne.mockResolvedValue(mockClientPackage);

            const result = await service.getActivePackageForClient('client-123', 'tenant-123');

            expect(clientPackageRepo.findOne).toHaveBeenCalledWith({
                where: {
                    clientId: 'client-123',
                    tenantId: 'tenant-123',
                    status: ClientPackageStatus.ACTIVE,
                },
            });
            expect(result).toBe(mockClientPackage);
        });

        it('should return null if no active package', async () => {
            clientPackageRepo.findOne.mockResolvedValue(null);

            const result = await service.getActivePackageForClient('client-123', 'tenant-123');

            expect(result).toBeNull();
        });
    });

    describe('getCurrentBalance', () => {
        it('should return current balance from last transaction', async () => {
            transactionRepo.findOne.mockResolvedValue({
                ...mockTransaction,
                runningBalance: 1500,
            });

            const result = await service.getCurrentBalance('tenant-123');

            expect(result).toEqual({ balance: 1500 });
        });

        it('should return 0 if no transactions', async () => {
            transactionRepo.findOne.mockResolvedValue(null);

            const result = await service.getCurrentBalance('tenant-123');

            expect(result).toEqual({ balance: 0 });
        });
    });

    describe('getSummary', () => {
        it('should return financial summary', async () => {
            const mockQueryBuilder = createMockQueryBuilder();
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { type: 'income', total: '2000' },
                { type: 'expense', total: '500' },
            ]);
            transactionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            const result = await service.getSummary('tenant-123');

            expect(result).toEqual({
                income: 2000,
                expense: 500,
                refund: 0,
                net: 1500,
            });
        });

        it('should return zero summary if no transactions', async () => {
            const mockQueryBuilder = createMockQueryBuilder();
            mockQueryBuilder.getRawMany.mockResolvedValue([]);
            transactionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            const result = await service.getSummary('tenant-123');

            expect(result).toEqual({
                income: 0,
                expense: 0,
                refund: 0,
                net: 0,
            });
        });
    });

    describe('createTransaction', () => {
        it('should create income transaction with updated balance', async () => {
            transactionRepo.findOne.mockResolvedValue({
                ...mockTransaction,
                runningBalance: 1000,
            });
            transactionRepo.create.mockReturnValue(mockTransaction);
            transactionRepo.save.mockResolvedValue(mockTransaction);

            await service.createTransaction({
                type: TransactionType.INCOME,
                category: TransactionCategory.PACKAGE_SALE,
                amount: 500,
                description: 'Test',
            }, 'tenant-123', 'user-123');

            expect(transactionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    runningBalance: 1500,
                })
            );
        });

        it('should subtract expense from balance', async () => {
            transactionRepo.findOne.mockResolvedValue({
                ...mockTransaction,
                runningBalance: 1000,
            });
            transactionRepo.create.mockReturnValue(mockTransaction);
            transactionRepo.save.mockResolvedValue(mockTransaction);

            await service.createTransaction({
                type: TransactionType.EXPENSE,
                category: TransactionCategory.RENT,
                amount: 200,
                description: 'Monthly rent',
            }, 'tenant-123', 'user-123');

            expect(transactionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    runningBalance: 800,
                })
            );
        });
    });
});
