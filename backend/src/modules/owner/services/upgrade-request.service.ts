import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { PlanUpgradeRequest, UpgradeRequestStatus } from '../entities/plan-upgrade-request.entity';
import { Plan } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PlanService } from './plan.service';
import { UsageTrackingService } from './usage-tracking.service';

@Injectable()
export class UpgradeRequestService {
    constructor(
        @InjectRepository(PlanUpgradeRequest)
        private readonly upgradeRequestRepository: Repository<PlanUpgradeRequest>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        private readonly planService: PlanService,
        private readonly usageTrackingService: UsageTrackingService,
    ) { }

    /**
     * Submit a plan upgrade request (tenant owner action)
     */
    async submitUpgradeRequest(
        tenantId: string,
        requestedById: string,
        requestedPlan: string,
        reason?: string,
    ): Promise<PlanUpgradeRequest> {
        // Check if there's already a pending request
        const existingRequest = await this.upgradeRequestRepository.findOne({
            where: { tenantId, status: 'pending' },
        });

        if (existingRequest) {
            throw new ConflictException('There is already a pending upgrade request for this tenant');
        }

        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException(`Tenant ${tenantId} not found`);
        }

        // Validate requested plan exists
        await this.planService.getPlanByKey(requestedPlan);

        const request = this.upgradeRequestRepository.create({
            tenantId,
            requestedById,
            currentPlan: tenant.plan,
            requestedPlan,
            reason: reason || null,
            status: 'pending',
        });

        return this.upgradeRequestRepository.save(request);
    }

    /**
     * Get pending request for a tenant
     */
    async getPendingRequest(tenantId: string): Promise<PlanUpgradeRequest | null> {
        return this.upgradeRequestRepository.findOne({
            where: { tenantId, status: 'pending' },
            relations: ['requestedBy', 'tenant'],
        });
    }

    /**
     * Cancel a pending request (tenant owner action)
     */
    async cancelRequest(requestId: string, tenantId: string): Promise<void> {
        const request = await this.upgradeRequestRepository.findOne({
            where: { id: requestId, tenantId, status: 'pending' },
        });

        if (!request) {
            throw new NotFoundException('Pending request not found');
        }

        await this.upgradeRequestRepository.delete(requestId);
    }

    /**
     * Get all pending requests (owner action)
     */
    async getAllPendingRequests(): Promise<PlanUpgradeRequest[]> {
        return this.upgradeRequestRepository.find({
            where: { status: 'pending' },
            relations: ['tenant', 'requestedBy'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Approve an upgrade request (owner action)
     */
    async approveRequest(
        requestId: string,
        reviewedById: string,
        reviewNotes?: string,
    ): Promise<PlanUpgradeRequest> {
        const request = await this.upgradeRequestRepository.findOne({
            where: { id: requestId },
            relations: ['tenant'],
        });

        if (!request) {
            throw new NotFoundException(`Request ${requestId} not found`);
        }

        if (request.status !== 'pending') {
            throw new ConflictException('Request has already been processed');
        }

        // Update the tenant's plan
        await this.planService.assignPlanToTenant(request.tenantId, request.requestedPlan);

        // Clear any blocks
        await this.usageTrackingService.clearBlockStatus(request.tenantId);

        // Update the request
        request.status = 'approved';
        request.reviewedById = reviewedById;
        request.reviewedAt = new Date();
        request.reviewNotes = reviewNotes || null;

        return this.upgradeRequestRepository.save(request);
    }

    /**
     * Reject an upgrade request (owner action)
     */
    async rejectRequest(
        requestId: string,
        reviewedById: string,
        reviewNotes: string,
    ): Promise<PlanUpgradeRequest> {
        const request = await this.upgradeRequestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException(`Request ${requestId} not found`);
        }

        if (request.status !== 'pending') {
            throw new ConflictException('Request has already been processed');
        }

        request.status = 'rejected';
        request.reviewedById = reviewedById;
        request.reviewedAt = new Date();
        request.reviewNotes = reviewNotes;

        return this.upgradeRequestRepository.save(request);
    }

    /**
     * Get request history for a tenant
     */
    async getTenantRequestHistory(tenantId: string): Promise<PlanUpgradeRequest[]> {
        return this.upgradeRequestRepository.find({
            where: { tenantId },
            relations: ['reviewedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get all requests with filters (owner action)
     */
    async getRequestsWithFilters(filters: {
        status?: UpgradeRequestStatus;
        tenantId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ requests: PlanUpgradeRequest[]; total: number }> {
        const queryBuilder = this.upgradeRequestRepository
            .createQueryBuilder('request')
            .leftJoinAndSelect('request.tenant', 'tenant')
            .leftJoinAndSelect('request.requestedBy', 'requestedBy')
            .leftJoinAndSelect('request.reviewedBy', 'reviewedBy');

        if (filters.status) {
            queryBuilder.andWhere('request.status = :status', { status: filters.status });
        }

        if (filters.tenantId) {
            queryBuilder.andWhere('request.tenantId = :tenantId', { tenantId: filters.tenantId });
        }

        queryBuilder.orderBy('request.createdAt', 'DESC');

        const total = await queryBuilder.getCount();

        if (filters.limit) {
            queryBuilder.limit(filters.limit);
        }

        if (filters.offset) {
            queryBuilder.offset(filters.offset);
        }

        const requests = await queryBuilder.getMany();

        return { requests, total };
    }
}
