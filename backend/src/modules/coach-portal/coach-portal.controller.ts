import { Controller, Get, Put, UseGuards, Request, Query, Param, Patch, Body, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CoachPortalService } from './coach-portal.service';
import { TenantId } from '../../common/decorators/user.decorator';
import { SessionStatus } from '../sessions/entities/session.entity';

@ApiTags('Coach Portal')
@Controller('coach-portal')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Roles('coach', 'admin', 'tenant_owner')
export class CoachPortalController {
    constructor(private readonly coachPortalService: CoachPortalService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get coach dashboard stats' })
    getDashboard(@Request() req: any, @TenantId() tenantId: string) {
        return this.coachPortalService.getDashboardStats(req.user.id, tenantId);
    }

    @Get('schedule')
    @ApiOperation({ summary: 'Get coach schedule' })
    @ApiQuery({ name: 'date', required: false, description: 'Specific date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'range', required: false, enum: ['day', 'week', 'month', 'future'] })
    getSchedule(
        @Request() req: any,
        @TenantId() tenantId: string,
        @Query('date') dateString?: string,
        @Query('range') range: 'day' | 'week' | 'month' | 'future' = 'day',
    ) {
        const date = dateString ? new Date(dateString) : new Date();
        return this.coachPortalService.getSchedule(req.user.id, tenantId, date, range);
    }

    @Patch('sessions/:id/status')
    @ApiOperation({ summary: 'Update session status (check-in/no-show)' })
    updateSessionStatus(
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body('status') status: string,
        @Request() req: any,
        @TenantId() tenantId: string,
    ) {
        return this.coachPortalService.updateSessionStatus(sessionId, req.user.id, tenantId, status as SessionStatus);
    }

    @Get('clients')
    @ApiOperation({ summary: 'Get assigned clients' })
    getClients(@Request() req: any, @TenantId() tenantId: string) {
        return this.coachPortalService.getMyClients(req.user.id, tenantId);
    }

    @Get('clients/:id')
    @ApiOperation({ summary: 'Get specific client details (only if assigned)' })
    async getClientDetails(
        @Param('id', ParseUUIDPipe) clientId: string,
        @Request() req: any,
        @TenantId() tenantId: string,
    ) {
        const hasAccess = await this.coachPortalService.checkClientAccess(req.user.id, clientId);
        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to this client');
        }
        return this.coachPortalService.getClientDetails(clientId, tenantId);
    }

    @Get('availability')
    @ApiOperation({ summary: 'Get availability rules' })
    getAvailability(@Request() req: any) {
        return this.coachPortalService.getAvailability(req.user.id);
    }

    @Put('availability')
    @ApiOperation({ summary: 'Update availability rules' })
    updateAvailability(@Request() req: any, @Body() rules: any[]) {
        return this.coachPortalService.updateAvailability(req.user.id, rules);
    }
}
