import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';
import { Package } from '../packages/entities/package.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Room } from '../rooms/entities/room.entity';
import { EmsDevice } from '../devices/entities/ems-device.entity';
import { WaitingListEntry } from '../waiting-list/entities/waiting-list.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  })),
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let leadRepo: Repository<Lead>;
  let clientPackageRepo: Repository<ClientPackage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Client), useFactory: mockRepository },
        { provide: getRepositoryToken(Session), useFactory: mockRepository },
        {
          provide: getRepositoryToken(ClientPackage),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(Package), useFactory: mockRepository },
        { provide: getRepositoryToken(Coach), useFactory: mockRepository },
        { provide: getRepositoryToken(Room), useFactory: mockRepository },
        { provide: getRepositoryToken(EmsDevice), useFactory: mockRepository },
        {
          provide: getRepositoryToken(WaitingListEntry),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(ClientSessionReview),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(Lead), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    leadRepo = module.get<Repository<Lead>>(getRepositoryToken(Lead));
    clientPackageRepo = module.get<Repository<ClientPackage>>(
      getRepositoryToken(ClientPackage),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeadAnalytics', () => {
    it('should return lead stats filtered by tenant', async () => {
      const tenantId = 'tenant-123';
      const query = { from: '2023-01-01', to: '2023-01-31' };

      jest
        .spyOn(leadRepo, 'count')
        .mockResolvedValueOnce(100) // Total
        .mockResolvedValueOnce(20); // Converted

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { source: 'Website', count: '50' },
          { source: 'Referral', count: '30' },
        ]),
      };

      jest
        .spyOn(leadRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      jest
        .spyOn(clientPackageRepo, 'createQueryBuilder')
        .mockReturnValue({
          ...mockQueryBuilder,
          getCount: jest.fn().mockResolvedValue(5),
          getRawOne: jest.fn().mockResolvedValue({ total: '500' }),
        } as any);

      const result = await service.getLeadAnalytics(tenantId, query);

      expect(result).toEqual({
        total: 100,
        converted: 20,
        conversionRate: 20,
        packagesSold: 5,
        revenue: 500,
        sources: [
          { source: 'Website', count: 50 },
          { source: 'Referral', count: 30 },
        ],
      });

      // Verify tenant isolation in count calls
      expect(leadRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );

      // Verify tenant isolation in QueryBuilder
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'lead.tenantId = :tenantId',
        { tenantId },
      );
    });
  });

  describe('getRevenueForecast', () => {
    it('should calculate linear regression correctly', async () => {
      const tenantId = 'tenant-123';

      // Mock data: perfectly linear growth 1000, 2000, 3000...
      const mockData = [
        { period: '2023-01', revenue: '1000' },
        { period: '2023-02', revenue: '2000' },
        { period: '2023-03', revenue: '3000' },
        { period: '2023-04', revenue: '4000' },
        { period: '2023-05', revenue: '5000' },
        { period: '2023-06', revenue: '6000' },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockData),
      };

      jest
        .spyOn(clientPackageRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getRevenueForecast(tenantId);

      // Slope m = 1000.  x=0->1000, x=1->2000 ... x=5->6000.
      // Next month x=6. y = 1000*6 + 1000 = 7000.

      // Wait, array index 0 is first point?
      // x: 0 (1000), 1 (2000), 2 (3000), 3 (4000), 4 (5000), 5 (6000)
      // 1000, 2000, 3000, 4000, 5000, 6000
      // x=0..5, y=1000..6000
      // Slope = 1000, Intercept = 1000
      // Next period x=6 => 1000*6 + 1000 = 7000
      expect(result.forecast).toBeCloseTo(7000);
      expect(result.trend).toBe('up');
      expect(result.growthRate).toBeCloseTo(16.67, 1); // (7000-6000)/6000 = 1/6 = 16.666...

      // Verify tenant filtering
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'cp.tenantId = :tenantId',
        { tenantId },
      );
    });

    it('should handle insufficient data gracefully', async () => {
      const tenantId = 'tenant-123';

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ period: '2023-01', revenue: '1000' }]), // Only 1 point
      };

      jest
        .spyOn(clientPackageRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getRevenueForecast(tenantId);

      expect(result.trend).toBe('flat');
      expect(result.forecast).toBe(0);
    });
  });
});
