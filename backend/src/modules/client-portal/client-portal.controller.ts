import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards';
import { ClientPortalService } from './client-portal.service';
import { ClientBookSessionDto } from './dto/client-book-session.dto';

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

        // We will delegate to service. GET /slots requires studioId usually.
        // If not provided, we can't calculate.
        if (!targetStudioId) {
            // For simplicity, I'll allow the service to pick one or error. 
            // But strict API is better.
        }

        return this.clientPortalService.getAvailableSlots(req.user.tenantId, req.user, date);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'Get my sessions' })
    async getMySessions(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.getMySessions(clientId, tenantId, from, to);
    }

    @Post('sessions')
    @ApiOperation({ summary: 'Book a session' })
    async bookSession(@Request() req: any, @Body() dto: ClientBookSessionDto) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.bookSession(clientId, tenantId, dto);
    }

    @Patch('sessions/:id/cancel')
    @ApiOperation({ summary: 'Cancel a session' })
    async cancelSession(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.clientPortalService.cancelSession(clientId, tenantId, id, reason);
    }
}
