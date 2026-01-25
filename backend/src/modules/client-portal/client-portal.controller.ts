import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards';
import { ClientPortalService } from './client-portal.service';
import { ClientBookSessionDto } from './dto/client-book-session.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

@ApiTags('client-portal')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('client-portal')
export class ClientPortalController {
    constructor(private readonly clientPortalService: ClientPortalService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get client dashboard summary' })
    async getDashboard(@Request() req: any) {
        const { clientId, tenantId } = req.user;

        if (!clientId) {
            throw new UnauthorizedException('User is not linked to a client profile');
        }

        return this.clientPortalService.getDashboard(clientId, tenantId);
    }

    @Get('slots')
    @ApiOperation({ summary: 'Get available session slots' })
    @ApiResponse({ status: 200, description: 'Returns available time slots' })
    async getAvailableSlots(
        @Request() req: any,
        @Query('date') date: string,
        @Query('studioId') studioId?: string,
        @Query('coachId') coachId?: string,
    ) {
        // Use user's default studio if not provided? Or first active studio.
        // For now, assuming single studio or requiring studioId.
        // If undefined, maybe fetch the first studio of the tenant.
        let targetStudioId = studioId;
        if (!targetStudioId) {
            // Quick hack: fetch any studio. Ideally client is linked to a home studio.
            // Or we just require frontend to pass it.
            // Let's rely on frontend sending it, or client-portal service handling it.
            // But to be safe, if missing, we error or find one.
            // Let's return error if missing for now, frontend should handle it.
            // Actually, let's fetch 'first' studio to be user-friendly.
        }

        return this.clientPortalService.getAvailableSlots(req.user.tenantId, req.user, date, coachId);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'Get my sessions' })
    async getMySessions(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getMySessions(clientId, tenantId, from, to);
    }

    @Get('coaches')
    @ApiOperation({ summary: 'Get active coaches suitable for client' })
    async getCoaches(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getCoaches(clientId, tenantId);
    }

    @Post('sessions')
    @ApiOperation({ summary: 'Book a session' })
    async bookSession(@Request() req: any, @Body() dto: ClientBookSessionDto) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.bookSession(clientId, tenantId, dto);
    }

    @Post('sessions/validate')
    @ApiOperation({ summary: 'Validate recurring session' })
    async validateSession(@Request() req: any, @Body() dto: ClientBookSessionDto) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.validateSession(clientId, tenantId, dto);
    }

    @Patch('sessions/:id/cancel')
    @ApiOperation({ summary: 'Cancel a session' })
    async cancelSession(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.cancelSession(clientId, tenantId, id, reason);
    }
    @Post('waiting-list')
    @ApiOperation({ summary: 'Join waiting list for a specific slot' })
    async joinWaitingList(@Request() req: any, @Body() dto: { studioId: string; preferredDate: string; preferredTimeSlot: string; notes?: string }) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.joinWaitingList(clientId, tenantId, dto);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get client profile' })
    async getProfile(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getProfile(clientId, tenantId);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update client profile' })
    async updateProfile(@Request() req: any, @Body() dto: UpdateClientProfileDto) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.updateProfile(clientId, tenantId, dto);
    }

    @Get('waiting-list')
    @ApiOperation({ summary: 'Get my waiting list entries' })
    async getMyWaitingList(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getMyWaitingList(clientId, tenantId);
    }

    @Delete('waiting-list/:id')
    @ApiOperation({ summary: 'Cancel a waiting list entry' })
    async cancelWaitingListEntry(@Request() req: any, @Param('id') id: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.cancelWaitingListEntry(clientId, tenantId, id);
    }

    @Post('favorite-coaches/:coachId')
    @ApiOperation({ summary: 'Toggle favorite status for a coach' })
    async toggleFavoriteCoach(@Request() req: any, @Param('coachId') coachId: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.toggleFavoriteCoach(clientId, tenantId, coachId);
    }

    @Get('favorite-coaches')
    @ApiOperation({ summary: 'Get favorite coaches' })
    async getFavoriteCoaches(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getFavoriteCoaches(clientId, tenantId);
    }
}
