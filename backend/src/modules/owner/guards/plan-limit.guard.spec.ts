import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlanLimitGuard, LIMIT_CHECK_KEY } from './plan-limit.guard';
import { UsageTrackingService } from '../services/usage-tracking.service';

describe('PlanLimitGuard', () => {
  let guard: PlanLimitGuard;
  let reflector: jest.Mocked<Reflector>;
  let usageTrackingService: jest.Mocked<UsageTrackingService>;

  const mockExecutionContext = (user?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: UsageTrackingService,
          useValue: {
            checkLimit: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PlanLimitGuard>(PlanLimitGuard);
    reflector = module.get(Reflector);
    usageTrackingService = module.get(UsageTrackingService);
  });

  it('should allow access if no limit check is required', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = mockExecutionContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(usageTrackingService.checkLimit).not.toHaveBeenCalled();
  });

  it('should allow access if no tenant context exists (e.g., owner)', async () => {
    reflector.getAllAndOverride.mockReturnValue('clients');
    const context = mockExecutionContext({ id: 'owner-1' }); // No tenantId

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException (402) if limit is exceeded', async () => {
    reflector.getAllAndOverride.mockReturnValue('clients');
    const user = { id: 'u1', tenantId: 't1' };
    const context = mockExecutionContext(user);

    const violation = {
      type: 'clients',
      current: 10,
      limit: 10,
      message: 'Client limit reached',
      plan: 'free',
    };
    usageTrackingService.checkLimit.mockResolvedValue(violation);

    try {
      await guard.canActivate(context);
      fail('Should have thrown ForbiddenException');
    } catch (e) {
      const { HttpException } = require('@nestjs/common');
      expect(e).toBeInstanceOf(HttpException);
      expect(e.response.statusCode).toBe(402);
      expect(e.response.message).toBe('Client limit reached');
    }
  });

  it('should allow access if limit is not exceeded', async () => {
    reflector.getAllAndOverride.mockReturnValue('clients');
    const user = { id: 'u1', tenantId: 't1' };
    const context = mockExecutionContext(user);

    usageTrackingService.checkLimit.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(usageTrackingService.checkLimit).toHaveBeenCalledWith(
      't1',
      'clients',
    );
  });
});
