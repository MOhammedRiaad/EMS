import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OwnerAnalyticsService, GlobalAnalytics } from '../services/owner-analytics.service';
import { RequirePermissions } from '../guards/permission.guard';

@ApiTags('owner/analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('owner/analytics')
export class OwnerAnalyticsController {
    constructor(private readonly analyticsService: OwnerAnalyticsService) { }

    @Get()
    @RequirePermissions('owner.analytics.view')
    @ApiOperation({ summary: 'Get comprehensive global analytics' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
    async getGlobalAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<GlobalAnalytics> {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getGlobalAnalytics(start, end);
    }

    @Get('revenue')
    @RequirePermissions('owner.analytics.view')
    @ApiOperation({ summary: 'Get revenue analytics' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getRevenueAnalytics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : now;
        return this.analyticsService.getRevenueAnalytics(start, end);
    }

    @Get('usage')
    @RequirePermissions('owner.analytics.view')
    @ApiOperation({ summary: 'Get usage trends' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getUsageTrends(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : now;
        return this.analyticsService.getUsageTrends(start, end);
    }

    @Get('growth')
    @RequirePermissions('owner.analytics.view')
    @ApiOperation({ summary: 'Get growth metrics' })
    async getGrowthMetrics() {
        return this.analyticsService.getGrowthMetrics();
    }

    @Get('engagement')
    @RequirePermissions('owner.analytics.view')
    @ApiOperation({ summary: 'Get engagement metrics' })
    async getEngagementMetrics() {
        return this.analyticsService.getEngagementMetrics();
    }
}
