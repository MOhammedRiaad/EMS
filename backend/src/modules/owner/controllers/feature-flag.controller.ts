import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureFlagService } from '../services/feature-flag.service';
import { RequirePermissions, PermissionGuard } from '../guards/permission.guard';

@Controller('owner/features')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class FeatureFlagController {
    constructor(private readonly featureFlagService: FeatureFlagService) { }

    /**
     * Get all feature flags
     */
    @Get()
    @RequirePermissions('owner.feature.view')
    async getAllFeatures() {
        return this.featureFlagService.getAllFeatureFlags();
    }

    /**
     * Get features for a specific tenant with resolved states
     */
    @Get('tenant/:tenantId')
    @RequirePermissions('owner.feature.view')
    async getFeaturesForTenant(@Param('tenantId') tenantId: string) {
        return this.featureFlagService.getFeaturesForTenant(tenantId);
    }

    /**
     * Toggle feature globally
     */
    @Post(':featureKey/toggle')
    @RequirePermissions('owner.feature.toggle')
    async toggleFeatureGlobally(
        @Param('featureKey') featureKey: string,
        @Body('enabled') enabled: boolean,
    ) {
        return this.featureFlagService.toggleFeatureGlobally(featureKey, enabled);
    }

    /**
     * Set feature override for a tenant
     */
    @Post(':featureKey/tenant/:tenantId')
    @RequirePermissions('owner.feature.toggle')
    async setFeatureForTenant(
        @Param('featureKey') featureKey: string,
        @Param('tenantId') tenantId: string,
        @Body('enabled') enabled: boolean,
        @Body('notes') notes: string,
        @Request() req: any,
    ) {
        return this.featureFlagService.setFeatureForTenant(
            tenantId,
            featureKey,
            enabled,
            req.user.id,
            notes,
        );
    }

    /**
     * Remove feature override for a tenant (revert to default)
     */
    @Delete(':featureKey/tenant/:tenantId')
    @RequirePermissions('owner.feature.toggle')
    async removeFeatureOverride(
        @Param('featureKey') featureKey: string,
        @Param('tenantId') tenantId: string,
    ) {
        await this.featureFlagService.removeFeatureOverride(tenantId, featureKey);
        return { success: true, message: 'Feature override removed' };
    }

    /**
     * Create a new feature flag
     */
    @Post()
    @RequirePermissions('owner.feature.toggle')
    async createFeatureFlag(
        @Body()
        data: {
            key: string;
            name: string;
            description?: string;
            category: string;
            defaultEnabled?: boolean;
            dependencies?: string[];
            isExperimental?: boolean;
        },
    ) {
        return this.featureFlagService.createFeatureFlag(data);
    }
}
