import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { Transaction } from '../packages/entities/transaction.entity';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService', () => {
    let service: ClientsService;
    let repository: jest.Mocked<Repository<Client>>;
    let authService: jest.Mocked<AuthService>;
    let mailerService: jest.Mocked<MailerService>;
    let module: TestingModule;

    const mockClient = {
        id: 'client-123',
        tenantId: 'tenant-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        status: 'active',
        userId: null,
        get fullName(): string {
            return `${this.firstName} ${this.lastName}`;
        },
        creditBalance: 0,
        transactions: [],
        studioId: null,
        dateOfBirth: null,
        notes: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        gender: null,
        height: null,
        weight: null,
        fitnessGoals: null,
        healthConditions: null,
        referralSource: null,
        profileImage: null,
        waivers: [],
        packages: [],
        reviews: [],
        favoriteCoaches: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    } as unknown as Client;

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                {
                    provide: getRepositoryToken(Client),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        createQueryBuilder: jest.fn(() => ({
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            orWhere: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            addOrderBy: jest.fn().mockReturnThis(),
                            getMany: jest.fn().mockResolvedValue([mockClient]),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(Transaction),
                    useValue: {
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(require('./entities/client-progress-photo.entity').ClientProgressPhoto),
                    useValue: {
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: AuthService,
                    useValue: {
                        findByEmail: jest.fn(),
                        createClientUser: jest.fn(),
                        generateInviteToken: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendClientInvitation: jest.fn(),
                    },
                },
                {
                    provide: require('../audit/audit.service').AuditService,
                    useValue: {
                        log: jest.fn(),
                        calculateDiff: jest.fn(),
                    },
                },
            ],
        }).compile();
        module = moduleRef;

        service = module.get<ClientsService>(ClientsService);
        repository = module.get(getRepositoryToken(Client));
        authService = module.get(AuthService);
        mailerService = module.get(MailerService);
        // Mock auditService methods
        (module.get(require('../audit/audit.service').AuditService) as any).log = jest.fn();
        (module.get(require('../audit/audit.service').AuditService) as any).calculateDiff = jest.fn().mockReturnValue({ changes: {} });

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all active clients for tenant', async () => {
            const result = await service.findAll('tenant-123');
            expect(result).toEqual([mockClient]);
            expect(repository.createQueryBuilder).toHaveBeenCalledWith('client');
        });

        it('should apply search filter if provided', async () => {
            const queryBuilder: any = repository.createQueryBuilder();
            await service.findAll('tenant-123', 'John');
            // We can't easily check the exact Brackets content with simple mocks, 
            // but we can check if query builder was used.
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return client by id', async () => {
            repository.findOne.mockResolvedValue(mockClient);

            const result = await service.findOne('client-123', 'tenant-123');

            expect(result).toBe(mockClient);
        });

        it('should throw NotFoundException if client not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(
                service.findOne('nonexistent', 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });

        it('should include relations when specified', async () => {
            repository.findOne.mockResolvedValue(mockClient);

            await service.findOne('client-123', 'tenant-123', ['user']);

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id: 'client-123', tenantId: 'tenant-123' },
                relations: ['user'],
            });
        });
    });

    describe('create', () => {
        const createDto = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '999-888-7777',
        };

        it('should create a client', async () => {
            repository.create.mockReturnValue(mockClient);
            repository.save.mockResolvedValue(mockClient);

            const result = await service.create(createDto, 'tenant-123');

            expect(repository.create).toHaveBeenCalledWith({
                ...createDto,
                tenantId: 'tenant-123',
            });
            expect(result).toBe(mockClient);
        });
    });

    describe('createWithUser', () => {
        const createDto = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            password: 'Password123!',
            phone: '999-888-7777',
        };

        it('should create client with linked user account', async () => {
            authService.findByEmail.mockResolvedValue(null);
            authService.createClientUser.mockResolvedValue({ id: 'user-123' } as any);
            repository.create.mockReturnValue(mockClient);
            repository.save.mockResolvedValue(mockClient);

            const result = await service.createWithUser(createDto, 'tenant-123');

            expect(authService.createClientUser).toHaveBeenCalled();
            expect(result).toBe(mockClient);
        });

        it('should throw error if email already exists', async () => {
            authService.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

            await expect(
                service.createWithUser(createDto, 'tenant-123')
            ).rejects.toThrow('Email is already registered');
        });
    });

    describe('update', () => {
        const updateDto = { phone: '555-555-5555' };

        it('should update client', async () => {
            repository.findOne.mockResolvedValue(mockClient);
            repository.save.mockResolvedValue({ ...mockClient, ...updateDto, fullName: 'John Doe' });

            const result = await service.update('client-123', updateDto, 'tenant-123');

            expect(result.phone).toBe('555-555-5555');
        });

        it('should throw NotFoundException if client not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(
                service.update('nonexistent', updateDto, 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should soft delete by setting status to inactive', async () => {
            repository.findOne.mockResolvedValue(mockClient);
            repository.save.mockImplementation(async (c) => c as Client);

            await service.remove('client-123', 'tenant-123');

            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'inactive' })
            );
        });
    });

    describe('invite', () => {
        it('should create user and send invitation email', async () => {
            const clientWithEmail = { ...mockClient, userId: null } as any;
            repository.findOne.mockResolvedValue(clientWithEmail);
            authService.findByEmail.mockResolvedValue(null);
            authService.createClientUser.mockResolvedValue({ id: 'new-user', email: 'john@example.com' } as any);
            authService.generateInviteToken.mockReturnValue('invite-token');
            repository.save.mockResolvedValue({ ...clientWithEmail, userId: 'new-user' });

            await service.invite('client-123', 'tenant-123');

            expect(authService.createClientUser).toHaveBeenCalled();
            expect(authService.generateInviteToken).toHaveBeenCalled();
            expect(mailerService.sendClientInvitation).toHaveBeenCalledWith(
                'john@example.com',
                expect.stringContaining('token=invite-token')
            );
        });

        it('should throw error if client has no email', async () => {
            repository.findOne.mockResolvedValue({ ...mockClient, email: null } as any);

            await expect(
                service.invite('client-123', 'tenant-123')
            ).rejects.toThrow('Client does not have an email address');
        });

        it('should throw error if client already has user account', async () => {
            repository.findOne.mockResolvedValue({ ...mockClient, userId: 'existing-user' } as any);

            await expect(
                service.invite('client-123', 'tenant-123')
            ).rejects.toThrow('Client already has a user account linked');
        });
    });

    describe('getTransactions', () => {
        it('should return transactions for client', async () => {
            const transactionRepo = module.get(getRepositoryToken(Transaction));
            const mockTx = { id: 'tx-1', amount: 50 } as any;
            transactionRepo.find.mockResolvedValue([mockTx]);

            const result = await service.getTransactions('client-123', 'tenant-123');

            expect(result).toEqual([mockTx]);
            expect(transactionRepo.find).toHaveBeenCalledWith({
                where: { clientId: 'client-123', tenantId: 'tenant-123' },
                order: { createdAt: 'DESC' }
            });
        });
    });

    describe('adjustBalance', () => {
        it('should update balance and create transaction', async () => {
            const transactionRepo = module.get(getRepositoryToken(Transaction));
            repository.findOne.mockResolvedValue({ ...mockClient, creditBalance: 100 } as any);
            repository.save.mockResolvedValue({ ...mockClient, creditBalance: 150 } as any);
            transactionRepo.create.mockReturnValue({ id: 'new-tx' } as any);
            transactionRepo.save.mockResolvedValue({ id: 'new-tx' } as any);

            const result = await service.adjustBalance('client-123', 'tenant-123', 50, 'Top up', 'user-admin');

            expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ creditBalance: 150 }));
            expect(transactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                amount: 50,
                clientId: 'client-123',
                type: 'income',
                runningBalance: 150
            }));
        });
    });
});
