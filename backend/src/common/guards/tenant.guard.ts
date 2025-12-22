import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user?.tenantId) {
            // Allow Super Admin to bypass tenant check (Global Access)
            if (user?.role === 'admin') {
                return true;
            }
            throw new ForbiddenException('Tenant context required');
        }

        // Attach tenant to request for easy access
        request.tenantId = user.tenantId;

        return true;
    }
}
