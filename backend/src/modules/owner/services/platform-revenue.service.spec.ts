import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformRevenueService } from './platform-revenue.service';
import { PlatformRevenue, RevenueStatus, RevenueType } from '../entities/platform-revenue.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { NotFoundException } from '@nestjs/common';

describe('PlatformRevenueService', () => {
    let service: PlatformRevenueService;
    let revenueRepo: jest.Mocked<Repository<PlatformRevenue>>;
    let tenantRepo: jest.Mocked<Repository<Tenant>>;

    const mockTenant = { id: 't1', name: 'Tenant 1' } as Tenant;
    const mockRevenue = { id: 'r1', amount: 100, tenantId: 't1', status: RevenueStatus.COMPLETED } as PlatformRevenue;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlatformRevenueService,
                {
                    provide: getRepositoryToken(PlatformRevenue),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PlatformRevenueService>(PlatformRevenueService);
        revenueRepo = module.get(getRepositoryToken(PlatformRevenue));
        tenantRepo = module.get(getRepositoryToken(Tenant));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a revenue record', async () => {
            const dto = {
                tenantId: 't1',
                amount: 100,
                type: RevenueType.SUBSCRIPTION,
            };

            tenantRepo.findOne.mockResolvedValue(mockTenant);
            revenueRepo.create.mockReturnValue(mockRevenue);
            revenueRepo.save.mockResolvedValue(mockRevenue);

            const result = await service.create(dto);

            expect(result).toEqual(mockRevenue);
            expect(tenantRepo.findOne).toHaveBeenCalledWith({ where: { id: 't1' } });
            expect(revenueRepo.create).toHaveBeenCalled();
            expect(revenueRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if tenant does not exist', async () => {
            tenantRepo.findOne.mockResolvedValue(null);

            await expect(service.create({ tenantId: 'non-existent', amount: 100 }))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return all revenue records', async () => {
            revenueRepo.find.mockResolvedValue([mockRevenue]);

            const result = await service.findAll({});

            expect(result).toEqual([mockRevenue]);
            expect(revenueRepo.find).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should calculate revenue stats', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            revenueRepo.find.mockResolvedValue([
                { ...mockRevenue, amount: 100 } as PlatformRevenue,
                { ...mockRevenue, amount: 150.50 } as PlatformRevenue,
            ]);

            const result = await service.getStats(startDate, endDate);

            expect(result.totalRevenue).toBe(250.50);
            expect(result.count).toBe(2);
            expect(result.period.start).toEqual(startDate);
        });
    });
});
