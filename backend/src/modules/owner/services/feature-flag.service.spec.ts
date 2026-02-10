import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FeatureAssignment } from '../entities/feature-assignment.entity';
import { Plan } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let flagRepo: jest.Mocked<Repository<FeatureFlag>>;
  let assignmentRepo: jest.Mocked<Repository<FeatureAssignment>>;
  let planRepo: jest.Mocked<Repository<Plan>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;

  const mockFlag: FeatureFlag = {
    key: 'test.feature',
    name: 'Test Feature',
    defaultEnabled: false,
    dependencies: [],
  } as FeatureFlag;

  const mockPlan: Plan = {
    key: 'pro',
    features: ['test.feature'],
  } as Plan;

  const mockTenant: Tenant = {
    id: 'tenant-1',
    plan: 'pro',
  } as Tenant;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: getRepositoryToken(FeatureFlag),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FeatureAssignment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<FeatureFlagService>(FeatureFlagService);
    flagRepo = module.get(getRepositoryToken(FeatureFlag));
    assignmentRepo = module.get(getRepositoryToken(FeatureAssignment));
    planRepo = module.get(getRepositoryToken(Plan));
    tenantRepo = module.get(getRepositoryToken(Tenant));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isFeatureEnabled', () => {
    it('should return true if there is a tenant override enabled', async () => {
      assignmentRepo.findOne.mockResolvedValue({
        enabled: true,
      } as FeatureAssignment);

      const result = await service.isFeatureEnabled('tenant-1', 'test.feature');

      expect(result).toBe(true);
      expect(assignmentRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', featureKey: 'test.feature' },
      });
    });

    it('should return false if there is a tenant override disabled', async () => {
      assignmentRepo.findOne.mockResolvedValue({
        enabled: false,
      } as FeatureAssignment);

      const result = await service.isFeatureEnabled('tenant-1', 'test.feature');

      expect(result).toBe(false);
    });

    it('should resolve to plan default if no tenant override exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      planRepo.findOne.mockResolvedValue(mockPlan);

      const result = await service.isFeatureEnabled('tenant-1', 'test.feature');

      expect(result).toBe(true); // 'test.feature' is in mockPlan.features
    });

    it('should resolve to global default if no tenant override or plan default exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      planRepo.findOne.mockResolvedValue({ ...mockPlan, features: [] } as Plan);
      flagRepo.findOne.mockResolvedValue({
        ...mockFlag,
        defaultEnabled: true,
      } as FeatureFlag);

      const result = await service.isFeatureEnabled('tenant-1', 'test.feature');

      expect(result).toBe(true);
    });

    it('should handle missing tenant or plan by falling back to global default', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      tenantRepo.findOne.mockResolvedValue(null);
      flagRepo.findOne.mockResolvedValue(mockFlag);

      const result = await service.isFeatureEnabled(
        'any-tenant',
        'test.feature',
      );

      expect(result).toBe(false); // mockFlag.defaultEnabled is false
    });
  });
});
