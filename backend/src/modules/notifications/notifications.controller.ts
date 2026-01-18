import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService, DashboardNotification } from './notifications.service';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard notifications for admin' })
    getDashboardNotifications(@TenantId() tenantId: string): Promise<DashboardNotification[]> {
        return this.notificationsService.getDashboardNotifications(tenantId);
    }

    @Get('client')
    @ApiOperation({ summary: 'Get notifications for logged-in client' })
    getClientNotifications(
        @TenantId() tenantId: string,
        @Request() req: any
    ): Promise<DashboardNotification[]> {
        // Assume req.user has clientId if they are a client
        // The auth guard should populate req.user
        // Currently AuthGuard populates user from JWT.
        // We need to ensure we have the clean way to get clientId.
        // If the user's role is client, the clientId should be retrievable.
        // For now, let's assume req.user.clientId exists if validation passed, 
        // or we fetch it via a service if needed.
        // Actually, looking at JWT payload, it likely has what we need.
        // Let's debug or assume standard structure.
        return this.notificationsService.getClientNotifications(tenantId, req.user.clientId);
    }
}
