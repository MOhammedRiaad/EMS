import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FeatureAssignment } from '../entities/feature-assignment.entity';
import { Plan } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class FeatureFlagService {
    constructor(
        @InjectRepository(FeatureFlag)
        private readonly featureFlagRepository: Repository<FeatureFlag>,
        @InjectRepository(FeatureAssignment)
        private readonly featureAssignmentRepository: Repository<FeatureAssignment>,
        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
    ) { }

    /**
     * Check if a feature is enabled for a tenant
     * Resolution order: Tenant Override → Plan Default → Global Default
     */
    async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
        // 1. Check for tenant-specific override (highest priority)
        const override = await this.featureAssignmentRepository.findOne({
            where: { tenantId, featureKey },
        });

        if (override) {
            return override.enabled;
        }

        // 2. Check plan default
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (tenant) {
            const plan = await this.planRepository.findOne({ where: { key: tenant.plan } });
            if (plan && plan.features.includes(featureKey)) {
                return true;
            }
            // If plan exists but doesn't include feature, check if feature is in experimental state
            // Plan-excluded features should return false unless there's an override
            if (plan && !plan.features.includes(featureKey)) {
                // Feature not in plan, check if it's a global default
                const feature = await this.featureFlagRepository.findOne({ where: { key: featureKey } });
                return feature?.defaultEnabled ?? false;
            }
        }

        // 3. Fall back to global default
        const feature = await this.featureFlagRepository.findOne({ where: { key: featureKey } });
        return feature?.defaultEnabled ?? false;
    }

    /**
     * Get all features with their resolved states for a tenant
     */
    async getFeaturesForTenant(
        tenantId: string,
    ): Promise<Array<{ feature: FeatureFlag; enabled: boolean; source: string }>> {
        const allFeatures = await this.featureFlagRepository.find({ order: { category: 'ASC', key: 'ASC' } });
        const overrides = await this.featureAssignmentRepository.find({ where: { tenantId } });
        const overrideMap = new Map(overrides.map((o) => [o.featureKey, o]));

        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        const plan = tenant ? await this.planRepository.findOne({ where: { key: tenant.plan } }) : null;
        const planFeatures = new Set(plan?.features || []);

        return allFeatures.map((feature) => {
            const override = overrideMap.get(feature.key);

            if (override) {
                return { feature, enabled: override.enabled, source: 'override' };
            }

            if (plan && planFeatures.has(feature.key)) {
                return { feature, enabled: true, source: 'plan' };
            }

            return { feature, enabled: feature.defaultEnabled, source: 'default' };
        });
    }

    /**
     * Set feature override for a tenant
     */
    async setFeatureForTenant(
        tenantId: string,
        featureKey: string,
        enabled: boolean,
        enabledBy: string,
        notes?: string,
    ): Promise<FeatureAssignment> {
        // Check if feature exists
        const feature = await this.featureFlagRepository.findOne({ where: { key: featureKey } });
        if (!feature) {
            throw new NotFoundException(`Feature "${featureKey}" not found`);
        }

        // Check dependencies if enabling
        if (enabled && feature.dependencies.length > 0) {
            for (const depKey of feature.dependencies) {
                const depEnabled = await this.isFeatureEnabled(tenantId, depKey);
                if (!depEnabled) {
                    throw new BadRequestException(`Cannot enable "${featureKey}": dependency "${depKey}" is not enabled`);
                }
            }
        }

        // Upsert the override
        let assignment = await this.featureAssignmentRepository.findOne({
            where: { tenantId, featureKey },
        });

        if (assignment) {
            assignment.enabled = enabled;
            assignment.enabledBy = enabledBy;
            assignment.notes = notes || assignment.notes;
        } else {
            assignment = this.featureAssignmentRepository.create({
                tenantId,
                featureKey,
                enabled,
                enabledBy,
                notes: notes || null,
            });
        }

        return this.featureAssignmentRepository.save(assignment);
    }

    /**
     * Remove feature override for a tenant (revert to plan/global default)
     */
    async removeFeatureOverride(tenantId: string, featureKey: string): Promise<void> {
        await this.featureAssignmentRepository.delete({ tenantId, featureKey });
    }

    /**
     * Toggle a feature globally (affects all tenants without overrides)
     */
    async toggleFeatureGlobally(featureKey: string, enabled: boolean): Promise<FeatureFlag> {
        const feature = await this.featureFlagRepository.findOne({ where: { key: featureKey } });
        if (!feature) {
            throw new NotFoundException(`Feature "${featureKey}" not found`);
        }

        feature.defaultEnabled = enabled;
        return this.featureFlagRepository.save(feature);
    }

    /**
     * Get all feature flags
     */
    async getAllFeatureFlags(): Promise<FeatureFlag[]> {
        return this.featureFlagRepository.find({ order: { category: 'ASC', key: 'ASC' } });
    }

    /**
     * Create a new feature flag
     */
    async createFeatureFlag(data: {
        key: string;
        name: string;
        description?: string;
        category: string;
        defaultEnabled?: boolean;
        dependencies?: string[];
        isExperimental?: boolean;
    }): Promise<FeatureFlag> {
        const feature = this.featureFlagRepository.create({
            key: data.key,
            name: data.name,
            description: data.description || null,
            category: data.category,
            defaultEnabled: data.defaultEnabled ?? true,
            dependencies: data.dependencies || [],
            isExperimental: data.isExperimental ?? false,
        });

        return this.featureFlagRepository.save(feature);
    }

    /**
     * Get features by category
     */
    async getFeaturesByCategory(category: string): Promise<FeatureFlag[]> {
        return this.featureFlagRepository.find({
            where: { category },
            order: { key: 'ASC' },
        });
    }
}
