import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { OwnerService } from './owner.service';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'usage' | 'system' | 'billing' | 'security';

export interface Alert {
    id: string;
    type: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    tenantId?: string;
    tenantName?: string;
    data?: Record<string, any>;
    createdAt: Date;
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
}

export interface AlertThreshold {
    type: string;
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    value: number;
    severity: AlertSeverity;
    category: AlertCategory;
    titleTemplate: string;
    messageTemplate: string;
}

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);
    private alerts: Alert[] = [];
    private readonly maxAlerts = 1000;

    // Configurable thresholds
    private readonly thresholds: AlertThreshold[] = [
        {
            type: 'usage_approaching_limit',
            metric: 'clients',
            operator: 'gte',
            value: 90,
            severity: 'warning',
            category: 'usage',
            titleTemplate: 'Client Limit Warning',
            messageTemplate: 'Tenant {tenantName} has used {percentage}% of their client limit',
        },
        {
            type: 'usage_at_limit',
            metric: 'clients',
            operator: 'gte',
            value: 100,
            severity: 'critical',
            category: 'usage',
            titleTemplate: 'Client Limit Reached',
            messageTemplate: 'Tenant {tenantName} has reached their client limit',
        },
        {
            type: 'usage_approaching_limit',
            metric: 'sessions',
            operator: 'gte',
            value: 90,
            severity: 'warning',
            category: 'usage',
            titleTemplate: 'Session Limit Warning',
            messageTemplate: 'Tenant {tenantName} has used {percentage}% of their monthly session limit',
        },
        {
            type: 'trial_expiring',
            metric: 'trialDays',
            operator: 'lte',
            value: 7,
            severity: 'info',
            category: 'billing',
            titleTemplate: 'Trial Expiring Soon',
            messageTemplate: 'Tenant {tenantName} trial expires in {days} days',
        },
        {
            type: 'inactive_tenant',
            metric: 'inactiveDays',
            operator: 'gte',
            value: 14,
            severity: 'warning',
            category: 'usage',
            titleTemplate: 'Inactive Tenant',
            messageTemplate: 'Tenant {tenantName} has been inactive for {days} days',
        },
    ];

    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        private readonly ownerService: OwnerService,
    ) { }

    /**
     * Get all active alerts with optional filters
     */
    getAlerts(filters?: {
        severity?: AlertSeverity;
        category?: AlertCategory;
        acknowledged?: boolean;
        tenantId?: string;
        limit?: number;
    }): Alert[] {
        let result = [...this.alerts];

        if (filters?.severity) {
            result = result.filter(a => a.severity === filters.severity);
        }
        if (filters?.category) {
            result = result.filter(a => a.category === filters.category);
        }
        if (filters?.acknowledged !== undefined) {
            result = result.filter(a => a.acknowledged === filters.acknowledged);
        }
        if (filters?.tenantId) {
            result = result.filter(a => a.tenantId === filters.tenantId);
        }

        // Sort by severity (critical first) then by date
        result.sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        if (filters?.limit) {
            result = result.slice(0, filters.limit);
        }

        return result;
    }

    /**
     * Get alert counts by severity
     */
    getAlertCounts(): { critical: number; warning: number; info: number; total: number } {
        const unacknowledged = this.alerts.filter(a => !a.acknowledged);
        return {
            critical: unacknowledged.filter(a => a.severity === 'critical').length,
            warning: unacknowledged.filter(a => a.severity === 'warning').length,
            info: unacknowledged.filter(a => a.severity === 'info').length,
            total: unacknowledged.length,
        };
    }

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string, userId: string): Alert | null {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date();
            alert.acknowledgedBy = userId;
            return alert;
        }
        return null;
    }

    /**
     * Acknowledge all alerts matching criteria
     */
    acknowledgeAlerts(
        filters: { severity?: AlertSeverity; category?: AlertCategory; tenantId?: string },
        userId: string,
    ): number {
        let count = 0;
        this.alerts.forEach(alert => {
            if (alert.acknowledged) return;

            const matches =
                (!filters.severity || alert.severity === filters.severity) &&
                (!filters.category || alert.category === filters.category) &&
                (!filters.tenantId || alert.tenantId === filters.tenantId);

            if (matches) {
                alert.acknowledged = true;
                alert.acknowledgedAt = new Date();
                alert.acknowledgedBy = userId;
                count++;
            }
        });
        return count;
    }

    /**
     * Create a new alert
     */
    createAlert(
        type: string,
        severity: AlertSeverity,
        category: AlertCategory,
        title: string,
        message: string,
        tenantId?: string,
        tenantName?: string,
        data?: Record<string, any>,
    ): Alert {
        const alert: Alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            category,
            title,
            message,
            tenantId,
            tenantName,
            data,
            createdAt: new Date(),
            acknowledged: false,
        };

        this.alerts.unshift(alert);

        // Trim old alerts if over limit
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
        }

        this.logger.log(`Alert created: [${severity}] ${title}`);
        return alert;
    }

    /**
     * Check all tenants for usage thresholds
     */
    @Cron(CronExpression.EVERY_HOUR)
    async checkUsageThresholds(): Promise<void> {
        this.logger.log('Running usage threshold checks...');

        try {
            const tenantsApproaching = await this.ownerService.getTenantsApproachingLimits(80);

            for (const item of tenantsApproaching) {
                // Create alert for each limit type being approached
                if (item.percentage >= 90) {
                    this.createUsageAlert(
                        {
                            tenantId: item.tenant.id,
                            tenantName: item.tenant.name,
                            usage: { [`${item.limitType}Percentage`]: item.percentage },
                        },
                        item.limitType,
                        item.percentage,
                    );
                }
            }

            this.logger.log(`Usage threshold check complete. Found ${tenantsApproaching.length} tenants approaching limits.`);
        } catch (error) {
            this.logger.error(`Failed to check usage thresholds: ${error.message}`);
        }
    }

    /**
     * Check for inactive tenants
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkInactiveTenants(): Promise<void> {
        this.logger.log('Checking for inactive tenants...');

        try {
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const inactiveTenants = await this.tenantRepository.find({
                where: {
                    lastActivityAt: LessThan(fourteenDaysAgo),
                },
            });

            for (const tenant of inactiveTenants) {
                const daysSinceActivity = Math.floor(
                    (Date.now() - (tenant.lastActivityAt?.getTime() || 0)) / (1000 * 60 * 60 * 24)
                );

                // Avoid duplicate alerts
                if (!this.hasRecentAlert('inactive_tenant', tenant.id, 7)) {
                    this.createAlert(
                        'inactive_tenant',
                        'warning',
                        'usage',
                        'Inactive Tenant',
                        `Tenant ${tenant.name} has been inactive for ${daysSinceActivity} days`,
                        tenant.id,
                        tenant.name,
                        { daysSinceActivity },
                    );
                }
            }

            this.logger.log(`Inactive tenant check complete. Found ${inactiveTenants.length} inactive tenants.`);
        } catch (error) {
            this.logger.error(`Failed to check inactive tenants: ${error.message}`);
        }
    }

    /**
     * Create usage-specific alert
     */
    private createUsageAlert(
        tenant: { tenantId: string; tenantName: string; usage: Record<string, any> },
        metric: string,
        percentage: number,
    ): void {
        const severity: AlertSeverity = percentage >= 100 ? 'critical' : 'warning';
        const alertType = percentage >= 100 ? 'usage_at_limit' : 'usage_approaching_limit';

        // Avoid duplicate alerts
        if (this.hasRecentAlert(alertType, tenant.tenantId, 24, metric)) {
            return;
        }

        this.createAlert(
            alertType,
            severity,
            'usage',
            percentage >= 100 ? `${metric} Limit Reached` : `${metric} Limit Warning`,
            `Tenant ${tenant.tenantName} has used ${percentage.toFixed(0)}% of their ${metric} limit`,
            tenant.tenantId,
            tenant.tenantName,
            { metric, percentage },
        );
    }

    /**
     * Check if a similar alert was created recently
     */
    private hasRecentAlert(type: string, tenantId: string, hoursAgo: number, metric?: string): boolean {
        const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
        return this.alerts.some(
            a =>
                a.type === type &&
                a.tenantId === tenantId &&
                a.createdAt.getTime() > cutoff &&
                (!metric || a.data?.metric === metric)
        );
    }

    /**
     * Clear old acknowledged alerts (older than 30 days)
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupOldAlerts(): Promise<void> {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const originalLength = this.alerts.length;

        this.alerts = this.alerts.filter(
            a => !a.acknowledged || a.createdAt.getTime() > thirtyDaysAgo
        );

        const removed = originalLength - this.alerts.length;
        if (removed > 0) {
            this.logger.log(`Cleaned up ${removed} old alerts`);
        }
    }
}
