import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards';
import { GamificationService } from './gamification.service';

import { CreateGoalDto } from './dto/create-goal.dto';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('gamification')
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) { }

    @Get('achievements')
    @ApiOperation({ summary: 'Get my unlocked achievements' })
    async getMyAchievements(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.gamificationService.getClientAchievements(clientId, tenantId);
    }

    @Get('goals')
    @ApiOperation({ summary: 'Get my fitness goals' })
    async getMyGoals(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.gamificationService.getClientGoals(clientId, tenantId);
    }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Get global leaderboard' })
    async getLeaderboard(@Request() req: any) {
        const { clientId, tenantId } = req.user;
        // Even if clientId is null (e.g. strict admin?), it works, just isCurrentUser will be false.
        // But AuthGuard logic enforces user.
        return this.gamificationService.getLeaderboard(tenantId, clientId);
    }

    @Get('feed')
    @ApiOperation({ summary: 'Get studio activity feed' })
    async getActivityFeed(@Request() req: any) {
        const { tenantId } = req.user;
        return this.gamificationService.getActivityFeed(tenantId);
    }

    @Post('goals')
    @ApiOperation({ summary: 'Set or update a fitness goal' })
    async setGoal(@Request() req: any, @Body() dto: CreateGoalDto) {
        const { clientId, tenantId } = req.user;
        if (!clientId) throw new UnauthorizedException('User is not linked to a client profile');
        return this.gamificationService.setGoal(clientId, tenantId, dto);
    }
}
