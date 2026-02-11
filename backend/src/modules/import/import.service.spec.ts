import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ImportService } from './import.service';
import { User } from '../auth/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { UsageTrackingService } from '../owner/services/usage-tracking.service';

describe('ImportService', () => {
    let service: ImportService;
    let dataSource: jest.Mocked<DataSource>;
    let usageTrackingService: jest.Mocked<UsageTrackingService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImportService,
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn().mockReturnValue({
                            connect: jest.fn(),
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            rollbackTransaction: jest.fn(),
                            release: jest.fn(),
                            manager: {
                                findOne: jest.fn(),
                                create: jest.fn(),
                                save: jest.fn(),
                            },
                        }),
                    },
                },
                {
                    provide: UsageTrackingService,
                    useValue: {
                        getUsageSnapshot: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Client),
                    useValue: {
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Coach),
                    useValue: {
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ImportService>(ImportService);
        dataSource = module.get(DataSource);
        usageTrackingService = module.get(UsageTrackingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('parseCSV', () => {
        it('should correctly parse CSV content into objects', () => {
            const csv = 'first_name,last_name,email\nJohn,Doe,john@example.com';
            const result = service.parseCSV<{ firstName: string; lastName: string; email: string }>(csv);

            expect(result).toHaveLength(1);
            expect(result[0].firstName).toBe('John');
            expect(result[0].lastName).toBe('Doe');
            expect(result[0].email).toBe('john@example.com');
        });
    });
    describe('validateClientImport', () => {
        it('should return valid if under limits', async () => {
            usageTrackingService.getUsageSnapshot.mockResolvedValue({
                clients: { current: 10, limit: 100 },
            } as any);

            const result = await service.validateClientImport('tenant-123', 5);
            expect(result.canImport).toBe(true);
            expect(result.importableCount).toBe(5);
        });

        it('should return partially valid if over limits', async () => {
            usageTrackingService.getUsageSnapshot.mockResolvedValue({
                clients: { current: 98, limit: 100 },
            } as any);

            const result = await service.validateClientImport('tenant-123', 5);
            expect(result.canImport).toBe(true); // Can still import some
            expect(result.importableCount).toBe(2);
            expect(result.wouldExceedBy).toBe(3);
        });
    });

    describe('importCoaches', () => {
        it('should import coaches with dummy emails and default studio when missing', async () => {
            const queryRunner = dataSource.createQueryRunner();
            const manager = queryRunner.manager as any;

            // Mock finding default studio
            manager.findOne.mockImplementation((entity: any, options: any) => {
                if (entity.name === 'Studio')
                    return Promise.resolve({ id: 'studio-123', name: 'Default Studio' });
                if (entity.name === 'User') return Promise.resolve(null); // No existing user
                return Promise.resolve(null);
            });

            manager.create.mockImplementation((entity: any, data: any) => data);
            manager.save.mockImplementation((entity: any, data: any) =>
                Promise.resolve({ id: 'new-id', ...data }),
            );

            const rows = [
                { firstName: 'Coach', lastName: 'One' }, // No email, no studio
            ];

            const result = await service.importCoaches('tenant-123', rows);

            expect(result.successCount).toBe(1);
            expect(manager.create).toHaveBeenCalledWith(
                User,
                expect.objectContaining({
                    email: expect.stringContaining('dummy_coach_'),
                    role: 'coach',
                }),
            );
            expect(manager.create).toHaveBeenCalledWith(
                Coach,
                expect.objectContaining({
                    studioId: 'studio-123',
                }),
            );
        });

        it('should use provided email and studio', async () => {
            const queryRunner = dataSource.createQueryRunner();
            const manager = queryRunner.manager as any;

            manager.findOne.mockResolvedValue(null);
            manager.create.mockImplementation((entity: any, data: any) => data);
            manager.save.mockImplementation((entity: any, data: any) =>
                Promise.resolve({ id: 'new-id', ...data }),
            );

            const rows = [
                {
                    firstName: 'Coach',
                    lastName: 'Two',
                    email: 'coach2@example.com',
                    studioId: 'studio-456',
                },
            ];

            const result = await service.importCoaches('tenant-123', rows);

            expect(result.successCount).toBe(1);
            expect(manager.create).toHaveBeenCalledWith(
                User,
                expect.objectContaining({
                    email: 'coach2@example.com',
                }),
            );
            expect(manager.create).toHaveBeenCalledWith(
                Coach,
                expect.objectContaining({
                    studioId: 'studio-456',
                }),
            );
        });
        it('should split firstName if lastName is missing and firstName has multiple words', async () => {
            const queryRunner = dataSource.createQueryRunner();
            const manager = queryRunner.manager as any;

            manager.findOne.mockResolvedValue(null);
            manager.create.mockImplementation((entity: any, data: any) => data);
            manager.save.mockImplementation((entity: any, data: any) =>
                Promise.resolve({ id: 'new-id', ...data }),
            );

            const rows = [
                { firstName: 'John Quincy Adams' }, // No lastName
            ];

            const result = await service.importCoaches('tenant-123', rows);

            expect(result.successCount).toBe(1);
            expect(manager.create).toHaveBeenCalledWith(
                User,
                expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Quincy Adams',
                }),
            );
        });
    });
});
