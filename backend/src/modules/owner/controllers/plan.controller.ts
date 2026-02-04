import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlanService } from '../services/plan.service';
import { PlanLimits } from '../entities/plan.entity';
import { RequirePermissions, PermissionGuard } from '../guards/permission.guard';

@Controller('owner/plans')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    /**
     * Get all plans
     */
    @Get()
    @RequirePermissions('owner.plan.manage')
    async getAllPlans() {
        return this.planService.getAllPlans();
    }

    /**
     * Get plan comparison (for upgrade modal)
     */
    @Get('compare')
    @RequirePermissions(['owner.plan.manage', 'tenant.upgrade.request'], 'OR')
    async comparePlans() {
        return this.planService.comparePlans();
    }

    /**
     * Get plan by key
     */
    @Get(':planKey')
    @RequirePermissions('owner.plan.manage')
    async getPlanByKey(@Param('planKey') planKey: string) {
        return this.planService.getPlanByKey(planKey);
    }

    /**
     * Create a new plan
     */
    @Post()
    @RequirePermissions('owner.plan.manage')
    async createPlan(
        @Body()
        data: {
            key: string;
            name: string;
            description?: string;
            limits: PlanLimits;
            features: string[];
            price?: number;
        },
    ) {
        return this.planService.createPlan(data);
    }

    /**
     * Update a plan
     */
    @Patch(':planId')
    @RequirePermissions('owner.plan.manage')
    async updatePlan(
        @Param('planId') planId: string,
        @Body()
        data: {
            name?: string;
            description?: string;
            limits?: Partial<PlanLimits>;
            features?: string[];
            price?: number;
            isActive?: boolean;
        },
    ) {
        return this.planService.updatePlan(planId, data);
    }
}
