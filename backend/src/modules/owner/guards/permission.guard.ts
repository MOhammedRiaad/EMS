import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../auth/services/permission.service';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_LOGIC_KEY = 'permissionLogic';

export type PermissionLogic = 'AND' | 'OR';

/**
 * Decorator to require specific permissions for an endpoint
 *
 * Usage:
 * @RequirePermissions('session.create')
 * @RequirePermissions(['client.read', 'session.create'], 'AND')
 * @RequirePermissions(['owner.tenant.list', 'admin.tenant.view'], 'OR')
 */
export const RequirePermissions = (
    permissions: string | string[],
    logic: PermissionLogic = 'AND',
) => {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
        SetMetadata(PERMISSIONS_KEY, permissionArray)(target, propertyKey!, descriptor!);
        SetMetadata(PERMISSION_LOGIC_KEY, logic)(target, propertyKey!, descriptor!);
    };
};

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly permissionService: PermissionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No permissions required
        }

        const logic =
            this.reflector.getAllAndOverride<PermissionLogic>(PERMISSION_LOGIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) || 'AND';

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            throw new ForbiddenException('User not authenticated');
        }

        let hasPermission: boolean;

        if (logic === 'AND') {
            hasPermission = await this.permissionService.hasAllPermissions(user.id, requiredPermissions);
        } else {
            hasPermission = await this.permissionService.hasAnyPermission(user.id, requiredPermissions);
        }

        if (!hasPermission) {
            throw new ForbiddenException({
                message: 'Insufficient permissions',
                requiredPermissions,
                logic,
            });
        }

        return true;
    }
}
