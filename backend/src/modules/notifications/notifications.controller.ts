import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
