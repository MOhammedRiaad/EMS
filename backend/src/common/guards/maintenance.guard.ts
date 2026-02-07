import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SystemConfigService } from '../../modules/owner/services/system-config.service';
import { PermissionService } from '../../modules/auth/services/permission.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
    constructor(
        private readonly systemConfigService: SystemConfigService,
        private readonly permissionService: PermissionService,
        private readonly jwtService: JwtService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const maintenanceMode = await this.systemConfigService.get<boolean>(
            'system.maintenance_mode',
            false,
        );

        if (!maintenanceMode) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const url = request.url;

        // Exclude critical paths from maintenance mode
        const excludedPaths = [
            '/api/auth/login',
            '/api/auth/2fa/authenticate',
            '/api/health',
            '/api/owner/settings', // Allow owner to toggle it back off
            '/api/owner/dashboard', // Also allow dashboard for owners
        ];

        if (excludedPaths.some((path) => url.startsWith(path))) {
            return true;
        }

        // Try to get user from request (if another guard already ran)
        // or manually verify token from header (since global guards run first)
        let user = request.user;
        if (!user) {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    user = this.jwtService.verify(token);
                } catch (error) {
                    // Token invalid, ignore
                }
            }
        }

        // Allow ONLY platform owners to bypass maintenance mode
        if (user) {
            const role = user.role;
            const userId = user.sub || user.id;

            if (role === 'platform_owner') {
                return true;
            }

            // Check roles from DB if role is not in token or to be sure
            if (userId) {
                const roles = await this.permissionService.getUserRoles(userId);
                const isOwner = roles.some((r) => r.key === 'platform_owner');
                if (isOwner) {
                    return true;
                }
            }
        }

        throw new ServiceUnavailableException({
            message: 'System is currently under maintenance. Please try again later.',
            code: 'MAINTENANCE_MODE',
        });
    }
}
