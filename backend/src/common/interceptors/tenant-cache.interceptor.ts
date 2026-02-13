import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class TenantCacheInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string | undefined {
        const request = context.switchToHttp().getRequest();
        const tenantId = request.tenantId || request.user?.tenantId;

        if (!tenantId) {
            return super.trackBy(context);
        }

        const key = super.trackBy(context);
        return `${tenantId}-${key}`;
    }
}
