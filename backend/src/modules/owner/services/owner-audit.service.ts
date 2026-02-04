import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnerAuditLog } from '../entities/owner-audit-log.entity';

export type OwnerAction =
  | 'SUSPEND_TENANT'
  | 'REACTIVATE_TENANT'
  | 'UPDATE_PLAN'
  | 'ENABLE_FEATURE'
  | 'DISABLE_FEATURE'
  | 'APPROVE_UPGRADE'
  | 'REJECT_UPGRADE'
  | 'BROADCAST_MESSAGE'
  | 'IMPERSONATE'
  | 'UPDATE_ROLE'
  | 'CREATE_ROLE'
  | 'DELETE_ROLE'
  | 'RESET_DEMO_DATA'
  | 'UPDATE_PERMISSIONS'
  | 'UPDATE_SYSTEM_SETTING'
  | 'DELETE_TENANT'
  | 'ANONYMIZE_TENANT';

@Injectable()
export class OwnerAuditService {
  constructor(
    @InjectRepository(OwnerAuditLog)
    private readonly auditLogRepository: Repository<OwnerAuditLog>,
  ) {}

  /**
   * Log an owner action
   */
  async logAction(
    ownerId: string,
    action: OwnerAction,
    details: Record<string, any>,
    targetTenantId?: string,
    ipAddress?: string,
  ): Promise<OwnerAuditLog> {
    const log = this.auditLogRepository.create({
      ownerId,
      action,
      targetTenantId: targetTenantId || null,
      details,
      ipAddress: ipAddress || null,
    });

    return this.auditLogRepository.save(log);
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    ownerId?: string;
    action?: string;
    targetTenantId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: OwnerAuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (filters.ownerId) {
      queryBuilder.andWhere('log.ownerId = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters.targetTenantId) {
      queryBuilder.andWhere('log.targetTenantId = :targetTenantId', {
        targetTenantId: filters.targetTenantId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get recent actions for a tenant
   */
  async getRecentActionsForTenant(
    tenantId: string,
    limit = 20,
  ): Promise<OwnerAuditLog[]> {
    return this.auditLogRepository.find({
      where: { targetTenantId: tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get action counts by type (for analytics)
   */
  async getActionCounts(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action');

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const results = await queryBuilder.getRawMany();

    return results.reduce(
      (acc, row) => {
        acc[row.action] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Count actions by type
   */
  async countActions(action: string): Promise<number> {
    return this.auditLogRepository.count({ where: { action } });
  }
}
