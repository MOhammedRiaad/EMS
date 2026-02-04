import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UpgradeRequestService } from '../services/upgrade-request.service';
import type { UpgradeRequestStatus } from '../entities/plan-upgrade-request.entity';
import { RequirePermissions, PermissionGuard } from '../guards/permission.guard';

@Controller('owner/upgrade-requests')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class UpgradeRequestController {
    constructor(private readonly upgradeRequestService: UpgradeRequestService) { }

    /**
     * Get all pending upgrade requests (owner view)
     */
    @Get()
    @RequirePermissions('owner.upgrade.approve')
    async getAllPendingRequests() {
        return this.upgradeRequestService.getAllPendingRequests();
    }

    /**
     * Get all requests with filters
     */
    @Get('all')
    @RequirePermissions('owner.upgrade.approve')
    async getRequestsWithFilters(
        @Query('status') status?: UpgradeRequestStatus,
        @Query('tenantId') tenantId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.upgradeRequestService.getRequestsWithFilters({
            status,
            tenantId,
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Approve an upgrade request
     */
    @Post(':requestId/approve')
    @RequirePermissions('owner.upgrade.approve')
    async approveRequest(
        @Param('requestId') requestId: string,
        @Body('notes') notes: string,
        @Request() req: any,
    ) {
        return this.upgradeRequestService.approveRequest(requestId, req.user.id, notes);
    }

    /**
     * Reject an upgrade request
     */
    @Post(':requestId/reject')
    @RequirePermissions('owner.upgrade.approve')
    async rejectRequest(
        @Param('requestId') requestId: string,
        @Body('notes') notes: string,
        @Request() req: any,
    ) {
        return this.upgradeRequestService.rejectRequest(requestId, req.user.id, notes);
    }
}

/**
 * Tenant-facing controller for upgrade requests
 */
@Controller('tenant/upgrade-requests')
@UseGuards(AuthGuard('jwt'))
export class TenantUpgradeRequestController {
    constructor(private readonly upgradeRequestService: UpgradeRequestService) { }

    /**
     * Submit an upgrade request (tenant action)
     */
    @Post()
    async submitRequest(
        @Body('requestedPlan') requestedPlan: string,
        @Body('reason') reason: string,
        @Request() req: any,
    ) {
        const { tenantId, id: userId } = req.user;
        return this.upgradeRequestService.submitUpgradeRequest(tenantId, userId, requestedPlan, reason);
    }

    /**
     * Get pending request for current tenant
     */
    @Get('pending')
    async getPendingRequest(@Request() req: any) {
        return this.upgradeRequestService.getPendingRequest(req.user.tenantId);
    }

    /**
     * Get request history for current tenant
     */
    @Get('history')
    async getRequestHistory(@Request() req: any) {
        return this.upgradeRequestService.getTenantRequestHistory(req.user.tenantId);
    }

    /**
     * Cancel pending request
     */
    @Post(':requestId/cancel')
    async cancelRequest(@Param('requestId') requestId: string, @Request() req: any) {
        await this.upgradeRequestService.cancelRequest(requestId, req.user.tenantId);
        return { success: true, message: 'Request cancelled' };
    }
}
