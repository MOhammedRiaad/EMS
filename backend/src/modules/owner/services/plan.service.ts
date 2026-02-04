import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanLimits } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get all active plans
   */
  async getAllPlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  /**
   * Get plan by key
   */
  async getPlanByKey(key: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { key } });
    if (!plan) {
      throw new NotFoundException(`Plan "${key}" not found`);
    }
    return plan;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return plan;
  }

  /**
   * Get the plan for a tenant
   */
  async getTenantPlan(tenantId: string): Promise<Plan> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }
    return this.getPlanByKey(tenant.plan);
  }

  /**
   * Get plan limits for a tenant
   */
  async getTenantLimits(tenantId: string): Promise<PlanLimits> {
    const plan = await this.getTenantPlan(tenantId);
    return plan.limits;
  }

  /**
   * Assign a plan to a tenant
   */
  async assignPlanToTenant(tenantId: string, planKey: string): Promise<Tenant> {
    const plan = await this.getPlanByKey(planKey);
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    tenant.plan = plan.key;

    // Clear any blocks if upgrading
    if (tenant.isBlocked) {
      tenant.isBlocked = false;
      tenant.blockReason = null;
    }

    return this.tenantRepository.save(tenant);
  }

  /**
   * Create a new plan
   */
  async createPlan(data: {
    key: string;
    name: string;
    description?: string;
    limits: PlanLimits;
    features: string[];
    price?: number;
  }): Promise<Plan> {
    const plan = this.planRepository.create({
      key: data.key,
      name: data.name,
      description: data.description || null,
      limits: data.limits,
      features: data.features,
      price: data.price || null,
      isActive: true,
    });

    return this.planRepository.save(plan);
  }

  /**
   * Update a plan
   */
  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      limits?: Partial<PlanLimits>;
      features?: string[];
      price?: number;
      isActive?: boolean;
    },
  ): Promise<Plan> {
    const plan = await this.getPlanById(id);

    if (data.name) plan.name = data.name;
    if (data.description !== undefined) plan.description = data.description;
    if (data.limits) plan.limits = { ...plan.limits, ...data.limits };
    if (data.features) plan.features = data.features;
    if (data.price !== undefined) plan.price = data.price;
    if (data.isActive !== undefined) plan.isActive = data.isActive;

    return this.planRepository.save(plan);
  }

  /**
   * Compare plans (for upgrade modal)
   */
  async comparePlans(): Promise<{
    plans: Plan[];
    comparison: Record<string, Record<string, any>>;
  }> {
    const plans = await this.getAllPlans();

    const comparison: Record<string, Record<string, any>> = {};

    for (const plan of plans) {
      comparison[plan.key] = {
        maxClients:
          plan.limits.maxClients === -1 ? 'Unlimited' : plan.limits.maxClients,
        maxCoaches:
          plan.limits.maxCoaches === -1 ? 'Unlimited' : plan.limits.maxCoaches,
        maxSessionsPerMonth:
          plan.limits.maxSessionsPerMonth === -1
            ? 'Unlimited'
            : plan.limits.maxSessionsPerMonth,
        smsAllowance:
          plan.limits.smsAllowance === -1
            ? 'Unlimited'
            : plan.limits.smsAllowance,
        emailAllowance:
          plan.limits.emailAllowance === -1
            ? 'Unlimited'
            : plan.limits.emailAllowance,
        storageGB:
          plan.limits.storageGB === -1
            ? 'Unlimited'
            : `${plan.limits.storageGB} GB`,
        featuresCount: plan.features.length,
        price: plan.price ? `$${plan.price}/month` : 'Contact Us',
      };
    }

    return { plans, comparison };
  }
}
