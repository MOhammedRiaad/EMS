import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageTrackingService } from '../services/usage-tracking.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(UsageTrackingService)
        private readonly usageTrackingService: UsageTrackingService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Check if public
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        // 2. Check if subscription check should be skipped
        const skipCheck = this.reflector.getAllAndOverride<boolean>('skipSubscriptionCheck', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipCheck) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 3. Skip for Platform Owner (Super Admin)
        if (user && user.role === 'owner') {
            return true;
        }

        // 4. Skip if no tenant context (should be covered by Public, but just in case)
        if (!user || !user.tenantId) {
            return true;
        }

        // Check subscription status
        const tenantId = user.tenantId;

        // We delegate the check to a service (e.g. usageTrackingService or a dedicated SubscriptionService)
        // The service check should return whether the subscription is valid/expired.
        const status = await this.usageTrackingService.checkSubscriptionStatus(tenantId);

        if (status.status === 'expired') {
            throw new HttpException(
                {
                    statusCode: HttpStatus.PAYMENT_REQUIRED,
                    message: 'Subscription expired',
                    error: 'Payment Required',
                    code: 'SUBSCRIPTION_EXPIRED', // Key for frontend handling
                    details: {
                        action: 'Renew your subscription to continue',
                        gracePeriod: status.inGracePeriod,
                    },
                },
                HttpStatus.PAYMENT_REQUIRED,
            );
        }

        return true;
    }
}
