import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipSubscriptionCheck } from '../../../common/decorators/skip-subscription-check.decorator';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { PlanService } from '../services/plan.service';
import { OwnerService } from '../services/owner.service';
import {
  RequirePermissions,
  PermissionGuard,
} from '../guards/permission.guard';

@Controller('owner/usage')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class UsageController {
  constructor(
    private readonly usageTrackingService: UsageTrackingService,
    private readonly planService: PlanService,
  ) { }

  /**
   * Get global usage stats (all tenants)
   */
  @Get('global')
  @RequirePermissions('owner.usage.view')
  async getGlobalUsageStats() {
    return this.usageTrackingService.getGlobalUsageStats();
  }

  /**
   * Get usage snapshot for a specific tenant
   */
  @Get('tenant/:tenantId')
  @RequirePermissions('owner.usage.view')
  async getTenantUsage(@Param('tenantId') tenantId: string) {
    return this.usageTrackingService.getUsageSnapshot(tenantId);
  }
}

/**
 * Tenant-facing controller for viewing their own usage
 */
@Controller('tenant/usage')
@UseGuards(AuthGuard('jwt'))
@SkipSubscriptionCheck()
export class TenantUsageController {
  constructor(
    private readonly usageTrackingService: UsageTrackingService,
    private readonly planService: PlanService,
    private readonly ownerService: OwnerService,
  ) { }

  /**
   * Get current tenant usage snapshot
   */
  @Get()
  async getUsage(@Request() req: any) {
    const usage = await this.usageTrackingService.getUsageSnapshot(
      req.user.tenantId,
    );
    const plan = await this.planService.getTenantPlan(req.user.tenantId);

    return {
      usage,
      plan: {
        key: plan.key,
        name: plan.name,
        limits: plan.limits,
      },
    };
  }

  /**
   * Get plan comparison for upgrade consideration
   */
  @Get('plans')
  async getPlans() {
    return this.planService.comparePlans();
  }

  /**
   * Check downgrade eligibility
   */
  @Post('check-downgrade')
  async checkDowngrade(
    @Request() req: any,
    @Body('planKey') planKey: string,
  ) {
    return this.ownerService.checkDowngradeEligibility(
      req.user.tenantId,
      planKey,
    );
  }
}
