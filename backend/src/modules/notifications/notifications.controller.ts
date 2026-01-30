import { Controller, Get, Post, Patch, Delete, UseGuards, Request, Body, Param } from '@nestjs/common';
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
    getClientDashboardNotifications(
        @TenantId() tenantId: string,
        @Request() req: any
    ): Promise<DashboardNotification[]> {
        return this.notificationsService.getClientNotifications(tenantId, req.user.clientId);
    }

    // --- In-App Notifications API ---

    @Get()
    @ApiOperation({ summary: 'Get persistent notifications for user' })
    getUserNotifications(
        @TenantId() tenantId: string,
        @Request() req: any
    ) {
        return this.notificationsService.getUserNotifications(req.user.id, tenantId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    getUnreadCount(
        @TenantId() tenantId: string,
        @Request() req: any
    ) {
        return this.notificationsService.getUnreadCount(req.user.id, tenantId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(
        @Request() req: any,
        @Param('id') id: string
    ) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllAsRead(
        @TenantId() tenantId: string,
        @Request() req: any
    ) {
        return this.notificationsService.markAllAsRead(req.user.id, tenantId);
    }

    // --- Announcements API ---

    @Get('announcements')
    @ApiOperation({ summary: 'Get all announcements (Admin)' })
    getAllAnnouncements(@TenantId() tenantId: string) {
        return this.notificationsService.getAllAnnouncements(tenantId);
    }

    @Get('announcements/active')
    @ApiOperation({ summary: 'Get active announcements for current user' })
    getActiveAnnouncements(
        @TenantId() tenantId: string,
        @Request() req: any
    ) {
        return this.notificationsService.getActiveAnnouncementsForUser(req.user.id, tenantId, req.user.role);
    }

    @Patch('announcements/:id/read')
    @ApiOperation({ summary: 'Mark announcement as read/seen' })
    markAnnouncementRead(
        @Request() req: any,
        @Param('id') id: string
    ) {
        return this.notificationsService.markAnnouncementRead(id, req.user.id);
    }

    @Post('announcements')
    @ApiOperation({ summary: 'Create announcement (Admin only)' })
    // @Roles('admin', 'tenant_owner') // Add role guard if available
    createAnnouncement(
        @TenantId() tenantId: string,
        @Body() body: any // Use DTO in production
    ) {
        return this.notificationsService.createAnnouncement({
            ...body,
            tenantId
        });
    }

    @Delete('announcements/:id')
    @ApiOperation({ summary: 'Delete announcement (Admin only)' })
    deleteAnnouncement(
        @TenantId() tenantId: string,
        @Param('id') id: string
    ) {
        return this.notificationsService.deleteAnnouncement(id, tenantId);
    }
}
