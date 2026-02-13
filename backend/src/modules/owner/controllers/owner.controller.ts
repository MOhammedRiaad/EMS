import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Ip,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OwnerService, TenantListFilters } from '../services/owner.service';
import { OwnerAuditService } from '../services/owner-audit.service';
import {
  RequirePermissions,
  PermissionGuard,
} from '../guards/permission.guard';
import {
  BroadcastService,
  SystemConfigService,
  FeatureFlagService,
  OwnerDataExportService,
} from '../services';

import { AutomationService } from '../../marketing/automation.service';

@Controller('owner')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly auditService: OwnerAuditService,
    private readonly automationService: AutomationService,
    private readonly broadcastService: BroadcastService,
    private readonly systemConfigService: SystemConfigService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly dataExportService: OwnerDataExportService,
  ) { }

  /**
   * Get global automation statistics
   */
  @Get('automations/stats')
  @RequirePermissions('owner.dashboard.view') // Reusing dashboard permission, or could create 'owner.automation.view'
  async getAutomationStats() {
    return this.automationService.getGlobalStats();
  }

  /**
   * Get global messaging statistics
   */
  @Get('messaging/stats')
  @RequirePermissions('owner.dashboard.view')
  async getMessagingStats() {
    return this.ownerService.getMessagingStats();
  }

  // --- Broadcasts ---

  @Post('broadcasts/draft')
  @RequirePermissions('owner.tenant.manage')
  async createBroadcast(@Body() dto: any, @Request() req: any) {
    return this.broadcastService.create(dto, req.user.id);
  }

  @Post('broadcasts/:id/send')
  @RequirePermissions('owner.tenant.manage')
  async sendBroadcast(
    @Param('id') id: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.broadcastService.send(id, req.user.id, ip);
  }

  @Get('broadcasts/history')
  @RequirePermissions('owner.dashboard.view')
  async getBroadcastHistory() {
    return this.broadcastService.getHistory();
  }

  // --- System Settings ---

  @Get('settings')
  @RequirePermissions('owner.dashboard.view')
  async getSystemSettings() {
    return {
      retention: await this.systemConfigService.getAllByCategory('retention'),
      security: await this.systemConfigService.getAllByCategory('security'),
      maintenance:
        await this.systemConfigService.getAllByCategory('maintenance'),
    };
  }

  @Patch('settings')
  @RequirePermissions('platform.settings.manage')
  async updateSystemSetting(
    @Body() body: { key: string; value: any; category: string },
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.systemConfigService.set(
      body.key,
      body.value,
      body.category,
      req.user.id,
      ip,
    );
  }

  /**
   * Get dashboard overview stats
   */
  @Get('dashboard')
  @RequirePermissions('owner.dashboard.view')
  async getDashboard() {
    return this.ownerService.getDashboardStats();
  }

  /**
   * List all tenants with filters
   */
  @Get('tenants')
  @RequirePermissions('owner.tenant.list')
  async listTenants(
    @Query('search') search?: string,
    @Query('status') status?: 'trial' | 'active' | 'suspended' | 'blocked',
    @Query('plan') plan?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: TenantListFilters = {
      search,
      status,
      plan,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };
    return this.ownerService.listTenants(filters);
  }

  /**
   * Get detailed tenant information
   */
  @Get('tenants/:tenantId')
  @RequirePermissions('owner.tenant.view')
  async getTenantDetails(@Param('tenantId') tenantId: string) {
    const tenant = await this.ownerService.getTenantDetails(tenantId);
    return { tenant };
  }

  /**
   * Export tenant data
   */
  @Get('tenants/:tenantId/export')
  @RequirePermissions('owner.tenant.view')
  async exportTenantData(@Param('tenantId') tenantId: string) {
    return this.dataExportService.exportTenantData(tenantId);
  }

  /**
   * Delete a tenant (Right to be Forgotten - Hard Delete)
   */
  @Delete('tenants/:tenantId')
  @RequirePermissions('owner.tenant.delete')
  async deleteTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    await this.ownerService.deleteTenant(tenantId, req.user.id, ip);
    return { success: true, message: 'Tenant deleted successfully' };
  }

  /**
   * Anonymize a tenant (Right to be Forgotten - Soft Delete)
   */
  @Post('tenants/:tenantId/anonymize')
  @RequirePermissions('owner.tenant.delete')
  async anonymizeTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.ownerService.anonymizeTenant(tenantId, req.user.id, ip);
  }

  /**
   * Suspend a tenant
   */
  @Post('tenants/:tenantId/suspend')
  @RequirePermissions('owner.tenant.suspend')
  async suspendTenant(
    @Param('tenantId') tenantId: string,
    @Body('reason') reason: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    const tenant = await this.ownerService.suspendTenant(
      tenantId,
      reason,
      req.user.id,
      ip,
    );
    return { tenant };
  }

  /**
   * Reactivate a suspended tenant
   */
  @Post('tenants/:tenantId/reactivate')
  @RequirePermissions('owner.tenant.suspend')
  async reactivateTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.ownerService.reactivateTenant(tenantId, req.user.id, ip);
  }

  /**
   * Update tenant plan
   */
  @Patch('tenants/:tenantId/plan')
  @RequirePermissions('owner.tenant.update.plan')
  async updateTenantPlan(
    @Param('tenantId') tenantId: string,
    @Body('planKey') planKey: string,
    @Body('subscriptionEndsAt') subscriptionEndsAt: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.ownerService.updateTenantPlan(
      tenantId,
      planKey,
      req.user.id,
      ip,
      subscriptionEndsAt ? new Date(subscriptionEndsAt) : undefined,
    );
  }

  /**
   * Update tenant subscription (manual renewal)
   */
  @Patch('tenants/:tenantId/subscription')
  @RequirePermissions('owner.tenant.update.plan')
  async updateTenantSubscription(
    @Param('tenantId') tenantId: string,
    @Body('subscriptionEndsAt') subscriptionEndsAt: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.ownerService.updateTenantSubscription(
      tenantId,
      new Date(subscriptionEndsAt),
      req.user.id,
      ip,
    );
  }

  /**
   * Check downgrade eligibility
   */
  @Post('tenants/:tenantId/check-downgrade')
  @RequirePermissions('owner.tenant.update.plan')
  async checkDowngrade(
    @Param('tenantId') tenantId: string,
    @Body('planKey') planKey: string,
  ) {
    return this.ownerService.checkDowngradeEligibility(tenantId, planKey);
  }

  /**
   * Generate impersonation token
   */
  @Post('tenants/:tenantId/impersonate')
  @RequirePermissions('owner.tenant.impersonate')
  async impersonateTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    return this.ownerService.generateImpersonationToken(
      tenantId,
      req.user.id,
      ip,
    );
  }

  /**
   * Update tenant notes
   */
  @Patch('tenants/:tenantId/notes')
  @RequirePermissions('owner.tenant.view')
  async updateTenantNotes(
    @Param('tenantId') tenantId: string,
    @Body('notes') notes: string,
  ) {
    return this.ownerService.updateTenantNotes(tenantId, notes);
  }

  /**
   * Reset demo data for a tenant
   */
  @Post('tenants/:tenantId/reset-demo')
  @RequirePermissions('owner.tenant.reset.demo')
  async resetDemoData(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    await this.ownerService.resetDemoData(tenantId, req.user.id, ip);
    return { success: true, message: 'Demo data reset initiated' };
  }

  /**
   * Get tenants approaching their limits
   */
  @Get('alerts/limits')
  @RequirePermissions('owner.usage.view')
  async getTenantsApproachingLimits(@Query('threshold') threshold?: string) {
    const thresholdValue = threshold ? parseInt(threshold, 10) : 80;
    return this.ownerService.getTenantsApproachingLimits(thresholdValue);
  }

  /**
   * Get audit logs
   */
  @Get('audit-logs')
  @RequirePermissions('owner.audit.view')
  async getAuditLogs(
    @Query('ownerId') ownerId?: string,
    @Query('action') action?: string,
    @Query('targetTenantId') targetTenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getLogs({
      ownerId,
      action,
      targetTenantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get Compliance Statistics
   */
  @Get('compliance/stats')
  @RequirePermissions('owner.audit.view')
  async getComplianceStats() {
    return this.ownerService.getComplianceStats();
  }
}
