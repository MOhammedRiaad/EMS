import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageTrackingService } from '../services/usage-tracking.service';

export const LIMIT_CHECK_KEY = 'limitCheck';

export type LimitType = 'clients' | 'coaches' | 'sessions' | 'sms' | 'email' | 'storage';

/**
 * Decorator to enforce plan limits on an endpoint
 *
 * Usage:
 * @CheckPlanLimit('sessions')
 * @CheckPlanLimit('clients')
 */
export const CheckPlanLimit = (limitType: LimitType) => {
    return SetMetadata(LIMIT_CHECK_KEY, limitType);
};

@Injectable()
export class PlanLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly usageTrackingService: UsageTrackingService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const limitType = this.reflector.getAllAndOverride<LimitType>(LIMIT_CHECK_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!limitType) {
            return true; // No limit check required
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            // No tenant context, skip limit check (might be owner)
            return true;
        }

        const tenantId = user.tenantId;

        // Check if tenant is already blocked
        const violation = await this.usageTrackingService.checkLimit(tenantId, limitType);

        if (violation) {
            throw new HttpException({
                statusCode: HttpStatus.PAYMENT_REQUIRED,
                message: violation.message,
                error: 'Payment Required',
                details: {
                    type: violation.type,
                    limit: violation.limit,
                    current: violation.current,
                    plan: violation.plan,
                    action: 'Upgrade your plan to continue',
                },
            }, HttpStatus.PAYMENT_REQUIRED);
        }

        return true;
    }
}
