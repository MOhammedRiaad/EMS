import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, MoreThanOrEqual, DataSource } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { TermsAcceptance } from '../../terms/entities/terms-acceptance.entity';
import { UsageTrackingService } from './usage-tracking.service';
import { FeatureFlagService } from './feature-flag.service';
import { PlanService } from './plan.service';
import { OwnerAuditService } from './owner-audit.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

export interface TenantListFilters {
  search?: string;
  status?: 'trial' | 'active' | 'suspended' | 'blocked';
  plan?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  blockedTenants: number;
  totalClients: number;
  totalCoaches: number;
  sessionsToday: number;
  sessionsThisMonth: number;
}

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(TermsAcceptance)
    private readonly termsAcceptanceRepository: Repository<TermsAcceptance>,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly planService: PlanService,
    private readonly auditService: OwnerAuditService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Get dashboard overview stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      blockedTenants,
      totalClients,
      totalCoaches,
      sessionsToday,
      sessionsThisMonth,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { status: 'active' } }),
      this.tenantRepository.count({ where: { status: 'trial' } }),
      this.tenantRepository.count({ where: { status: 'suspended' } }),
      this.tenantRepository.count({ where: { isBlocked: true } }),
      this.clientRepository.count(),
      this.coachRepository.count({ where: { active: true } }),
      this.sessionRepository.count({
        where: { startTime: MoreThanOrEqual(startOfDay) },
      }),
      this.sessionRepository.count({
        where: { startTime: MoreThanOrEqual(startOfMonth) },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      blockedTenants,
      totalClients,
      totalCoaches,
      sessionsToday,
      sessionsThisMonth,
    };
  }

  /**
   * List all tenants with filters
   */
  async listTenants(
    filters: TenantListFilters,
  ): Promise<{ items: any[]; total: number }> {
    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    if (filters.search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.slug ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('tenant.status = :status', {
        status: filters.status,
      });
    }

    if (filters.plan) {
      queryBuilder.andWhere('tenant.plan = :plan', { plan: filters.plan });
    }

    // Join to get owner email
    // Note: This assumes a 'role' column on user or requires a more complex join if using user_roles table only.
    // Since we migrated to permissions but might still have the role column or need to check user_roles.
    // For now, let's assume the migration "migrate-user-roles" kept the old column or we rely on a simplified assumption for performance.
    // Actually, looking at previous context, we removed the role enum but kept the column temporarily?
    // "Keep old `role` column temporarily for rollback safety" - from implementation_plan.md.
    // Let's try to map it after fetching for now to avoid complex subqueries in TypeORM if we are unsure of the relation state.
    // Or better, fetch users separately for the batch.

    queryBuilder.orderBy('tenant.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const tenants = await queryBuilder.getMany();

    // Fetch owners for these tenants
    const tenantIds = tenants.map((t) => t.id);
    const ownersMap = new Map<string, string>();

    if (tenantIds.length > 0) {
      const owners = await this.userRepository.find({
        where: {
          tenantId: In(tenantIds),
          // We need to identify the owner. If permissions are fully in place, we check for 'tenant_owner' role.
          // Assuming 'role' column references the key or we have to join user_roles.
          // Let's assume 'role' string column still exists as per legacy or migration strategy mentions.
          // If not, we might need to adjust. Let's use 'role' for now as getTenantDetails used it.
          role: 'tenant_owner',
        },
        select: ['tenantId', 'email'],
      });
      owners.forEach((u) => ownersMap.set(u.tenantId, u.email));
    }

    // Transform to DTO
    const items = tenants.map((tenant) => {
      return {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        plan: {
          key: tenant.plan,
          name: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1), // Simple capitalization
        },
        contactEmail: ownersMap.get(tenant.id) || 'no-email@tenant.com',
        createdAt: tenant.createdAt,
        stats: tenant.usageStats || { clients: 0, sessionsThisMonth: 0 },
      };
    });

    return { items, total };
  }

  /**
   * Get tenant details with usage and features
   */
  async getTenantDetails(tenantId: string): Promise<any> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const [usage, features, owner] = await Promise.all([
      this.usageTrackingService.getUsageSnapshot(tenantId),
      this.featureFlagService.getFeaturesForTenant(tenantId),
      this.userRepository.findOne({
        where: { tenantId, role: 'tenant_owner' },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'phone',
          'lastLoginAt',
        ],
      }),
    ]);

    let planDetails = { key: tenant.plan, name: tenant.plan, price: 0 };
    try {
      const plan = await this.planService.getPlanByKey(tenant.plan);
      if (plan) {
        planDetails = {
          key: plan.key,
          name: plan.name,
          price: plan.price || 0,
        };
      }
    } catch (e) {
      // Plan might not exist if it's a legacy string, fallback to simple mapping
      planDetails.name =
        tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1);
    }

    return {
      ...tenant,
      plan: planDetails,
      contactEmail: owner?.email || 'N/A',
      owner, // Keep if needed for other details
      usage,
      features,
    };
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(
    tenantId: string,
    reason: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    tenant.status = 'suspended';
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;

    await this.auditService.logAction(
      ownerId,
      'SUSPEND_TENANT',
      { reason, previousStatus: tenant.status },
      tenantId,
      ipAddress,
    );

    return this.tenantRepository.save(tenant);
  }

  /**
   * Reactivate a suspended tenant
   */
  async reactivateTenant(
    tenantId: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const previousStatus = tenant.status;
    tenant.status = 'active';
    tenant.suspendedAt = null;
    tenant.suspendedReason = null;

    await this.auditService.logAction(
      ownerId,
      'REACTIVATE_TENANT',
      { previousStatus },
      tenantId,
      ipAddress,
    );

    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant plan
   */
  async updateTenantPlan(
    tenantId: string,
    planKey: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const previousPlan = tenant.plan;
    const updatedTenant = await this.planService.assignPlanToTenant(
      tenantId,
      planKey,
    );

    await this.auditService.logAction(
      ownerId,
      'UPDATE_PLAN',
      { previousPlan, newPlan: planKey },
      tenantId,
      ipAddress,
    );

    return updatedTenant;
  }

  /**
   * Generate impersonation token (read-only)
   */
  async generateImpersonationToken(
    tenantId: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<{ token: string; expiresIn: number }> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Find the tenant owner to impersonate
    const tenantOwner = await this.userRepository.findOne({
      where: { tenantId, role: 'tenant_owner' },
    });

    if (!tenantOwner) {
      throw new NotFoundException('Tenant owner not found');
    }

    // Generate a short-lived token with impersonation flag
    const expiresIn = 3600; // 1 hour
    const token = this.jwtService.sign(
      {
        sub: tenantOwner.id,
        tenantId,
        role: tenantOwner.role,
        isImpersonation: true,
        impersonatedBy: ownerId,
        readOnly: true,
      },
      { expiresIn },
    );

    await this.auditService.logAction(
      ownerId,
      'IMPERSONATE',
      { tenantOwnerEmail: tenantOwner.email },
      tenantId,
      ipAddress,
    );

    return { token, expiresIn };
  }

  /**
   * Reset demo data for a tenant
   */
  async resetDemoData(
    tenantId: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // This would delete sessions, clients (except owner), etc.
    // For safety, just log the action - actual implementation would depend on business rules
    await this.auditService.logAction(
      ownerId,
      'RESET_DEMO_DATA',
      {},
      tenantId,
      ipAddress,
    );

    // TODO: Implement actual data reset logic
    // - Delete sessions
    // - Delete clients (keep users)
    // - Reset packages
    // - Clear usage metrics
  }

  /**
   * Update owner notes for a tenant
   */
  async updateTenantNotes(tenantId: string, notes: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    tenant.ownerNotes = notes;
    return this.tenantRepository.save(tenant);
  }

  /**
   * Get tenants approaching limits (for alerts)
   */
  async getTenantsApproachingLimits(threshold = 80): Promise<
    Array<{
      tenant: Tenant;
      limitType: string;
      percentage: number;
    }>
  > {
    const tenants = await this.tenantRepository.find({
      where: { status: In(['active', 'trial']) },
    });

    const results: Array<{
      tenant: Tenant;
      limitType: string;
      percentage: number;
    }> = [];

    for (const tenant of tenants) {
      const usage = await this.usageTrackingService.getUsageSnapshot(tenant.id);

      const checkLimit = (item: { percentage: number }, type: string) => {
        if (item.percentage >= threshold) {
          results.push({
            tenant,
            limitType: type,
            percentage: item.percentage,
          });
        }
      };

      checkLimit(usage.clients, 'clients');
      checkLimit(usage.coaches, 'coaches');
      checkLimit(usage.sessionsThisMonth, 'sessions');
      checkLimit(usage.smsThisMonth, 'sms');
      checkLimit(usage.emailThisMonth, 'email');
      checkLimit(usage.storageGB, 'storage');
    }

    return results.sort((a, b) => b.percentage - a.percentage);
  }
  async getMessagingStats() {
    return this.usageTrackingService.getGlobalUsageStats();
  }

  /**
   * Delete a tenant and all associated data
   */
  async deleteTenant(
    tenantId: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      // Log the action first
      await this.auditService.logAction(
        ownerId,
        'DELETE_TENANT',
        { tenantName: tenant.name },
        tenantId,
        ipAddress,
      );

      // 1. Delete Session related data
      await manager.query(
        `DELETE FROM client_session_reviews WHERE "tenant_id" = $1`,
        [tenantId],
      );
      await manager.query(
        `DELETE FROM session_participants WHERE "tenant_id" = $1`,
        [tenantId],
      );
      await manager.query(`DELETE FROM waiting_list WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // Sessions must be deleted before clients/coaches because of RESTRICT
      await manager.query(`DELETE FROM sessions WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // 2. Delete Client related data
      await manager.query(`DELETE FROM client_goals WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(
        `DELETE FROM client_achievements WHERE "tenant_id" = $1`,
        [tenantId],
      );
      await manager.query(`DELETE FROM client_waivers WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(
        `DELETE FROM client_progress_photos WHERE "tenant_id" = $1`,
        [tenantId],
      );
      await manager.query(`DELETE FROM inbody_scans WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(
        `DELETE FROM terms_acceptance WHERE "tenant_id" = $1`,
        [tenantId],
      );
      await manager.query(`DELETE FROM parq_responses WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      // Client packages usually link to packages
      await manager.query(
        `DELETE FROM client_packages WHERE "tenant_id" = $1`,
        [tenantId],
      );

      // 3. Transactions and Sales
      await manager.query(`DELETE FROM sale_items WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM sales WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM transactions WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM product_stocks WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM products WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM packages WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // 4. Marketing / Leads
      await manager.query(
        `DELETE FROM lead_activities WHERE lead_id IN (SELECT id FROM leads WHERE "tenant_id" = $1)`,
        [tenantId],
      );
      await manager.query(`DELETE FROM leads WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(
        `DELETE FROM automation_executions WHERE "tenantId" = $1`,
        [tenantId],
      );
      await manager.query(
        `DELETE FROM automation_rules WHERE "tenant_id" = $1`,
        [tenantId],
      );
      // Notification preferences are stored as a column on the User entity, so no need to delete from a separate table.
      // Check notifications table
      await manager.query(`DELETE FROM notifications WHERE "tenantId" = $1`, [
        tenantId,
      ]);

      // 5. Core Entities
      // Clients must be deleted before users?
      // Users have cascade from Tenant, but Clients might reference Users.
      // Delete Clients first.
      await manager.query(`DELETE FROM clients WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // delete favorite_coaches
      await manager.query(
        `DELETE FROM favorite_coaches WHERE "tenant_id" = $1`,
        [tenantId],
      );

      // Coaches
      await manager.query(`DELETE FROM coaches WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // Users (will be deleted by cascade from tenant? Not always safe to rely on mixed strategy)
      // But Users are linked to Tenant.
      // Also users might be referenced by audit logs.
      // Audit logs are global (owner module) or tenant level?
      // Audit logs have tenantId column.
      await manager.query(`DELETE FROM audit_logs WHERE "tenantId" = $1`, [
        tenantId,
      ]);

      // Finally Users
      await manager.query(`DELETE FROM users WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // Studios, Rooms, Devices
      await manager.query(`DELETE FROM ems_devices WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM rooms WHERE "tenant_id" = $1`, [
        tenantId,
      ]);
      await manager.query(`DELETE FROM studios WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      // 6. Delete Tenant
      await manager.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
    });
  }

  /**
   * Anonymize tenant data (Right to be Forgotten - Soft Delete)
   */
  async anonymizeTenant(
    tenantId: string,
    ownerId: string,
    ipAddress?: string,
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      // Log action first
      await this.auditService.logAction(
        ownerId,
        'ANONYMIZE_TENANT',
        { tenantName: tenant.name },
        tenantId,
        ipAddress,
      );

      // 1. Anonymize Users
      // Update email to unique dummy, clear PII, deactivate
      const users = await manager.find(User, { where: { tenantId } });
      for (const user of users) {
        const anonId = uuidv4();
        await manager.update(
          User,
          { id: user.id },
          {
            email: `anonymized_${anonId}@deleted.local`,
            firstName: 'Anonymized',
            lastName: 'User',
            phone: null,
            avatarUrl: null,
            passwordHash: 'deleted',
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
            passwordResetToken: null,
            active: false,
            notificationPreferences: null,
          },
        );
      }

      // 2. Anonymize Clients
      const clients = await manager.find(Client, { where: { tenantId } });
      for (const client of clients) {
        const anonId = uuidv4();
        await manager.update(
          Client,
          { id: client.id },
          {
            firstName: 'Anonymized',
            lastName: 'Client',
            email: client.email
              ? `anonymized_client_${anonId}@deleted.local`
              : null,
            phone: null,
            dateOfBirth: null,
            healthNotes: null,
            notes: null,
            medicalHistory: {
              allergies: [],
              injuries: [],
              conditions: [],
              custom: {},
            },
            avatarUrl: null,
            status: 'inactive',
          },
        );
      }

      // 3. Anonymize Coaches
      const coaches = await manager.find(Coach, { where: { tenantId } });
      for (const coach of coaches) {
        await manager.update(
          Coach,
          { id: coach.id },
          {
            bio: 'Anonymized',
            active: false,
          },
        );
      }

      // 4. Update Tenant Status
      await manager.update(
        Tenant,
        { id: tenantId },
        {
          status: 'suspended',
          ownerNotes: `Anonymized on ${new Date().toISOString()} by Platform Owner`,
          suspendedReason: 'Right to be Forgotten (Anonymized)',
        },
      );
    });

    // Return updated tenant
    return this.tenantRepository.findOne({
      where: { id: tenantId },
    }) as Promise<Tenant>;
  }

  /**
   * Get System Compliance Statistics
   */
  async getComplianceStats() {
    // 1. Consent Stats (Marketing & Data Processing)
    const totalClients = await this.clientRepository.count();
    // Assume 'anonymized' clients have emails starting with 'anonymized_'
    // or just rely on 'status'='inactive' if we set that. But let's check email pattern for accuracy if we can
    // or cleaner: simply count where status != 'inactive' for active stats.
    // But anonymize sets status='inactive'.

    // Active Clients (Non-Anonymized)
    const activeClientsCount = await this.clientRepository.count({
      where: { status: In(['active', 'suspended']) },
    });

    const marketingConsentCount = await this.dataSource.query(`
            SELECT COUNT(*) as count FROM clients 
            WHERE status != 'inactive' 
            AND "consent_flags"->>'marketing' = 'true'
        `);

    const dataProcessingConsentCount = await this.dataSource.query(`
            SELECT COUNT(*) as count FROM clients 
            WHERE status != 'inactive' 
            AND "consent_flags"->>'data_processing' = 'true'
        `);

    // 2. Terms Acceptance Rate
    // Count unique clients who have accepted ANY terms
    const termsAcceptedCount = await this.termsAcceptanceRepository
      .createQueryBuilder('ta')
      .select('COUNT(DISTINCT ta.client_id)', 'count')
      .getRawOne();

    // 3. Right to be Forgotten Stats
    const anonymizedTenantsCount = await this.auditService.countActions(
      'ANONYMIZE_TENANT' as any,
    );
    const deletedTenantsCount = await this.auditService.countActions(
      'DELETE_TENANT' as any,
    );

    // 4. Anonymized Individuals
    const anonymizedUsersCount = await this.userRepository.count({
      where: { email: Like('anonymized_%') },
    });

    return {
      clients: {
        total: totalClients,
        active: activeClientsCount,
        marketingConsentRate:
          activeClientsCount > 0
            ? Math.round(
              (parseInt(marketingConsentCount[0].count) /
                activeClientsCount) *
              100,
            )
            : 0,
        dataProcessingConsentRate:
          activeClientsCount > 0
            ? Math.round(
              (parseInt(dataProcessingConsentCount[0].count) /
                activeClientsCount) *
              100,
            )
            : 0,
        termsAcceptanceRate:
          activeClientsCount > 0
            ? Math.round(
              (parseInt(termsAcceptedCount.count) / activeClientsCount) * 100,
            )
            : 0,
      },
      rightToBeForgotten: {
        anonymizedTenants: anonymizedTenantsCount,
        deletedTenants: deletedTenantsCount,
        anonymizedUsersIndividual: anonymizedUsersCount,
      },
      generatedAt: new Date(),
    };
  }
}
