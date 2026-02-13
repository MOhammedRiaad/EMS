import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PlatformRevenueService } from '../services/platform-revenue.service';
import { CreatePlatformRevenueDto, PlatformRevenueFiltersDto } from '../dto/platform-revenue.dto';
import { RequirePermissions } from '../guards/permission.guard';

@ApiTags('owner/revenue')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('owner/revenue')
export class PlatformRevenueController {
    constructor(private readonly revenueService: PlatformRevenueService) { }

    @Post()
    @RequirePermissions('owner.revenue.create')
    @ApiOperation({ summary: 'Record new platform revenue' })
    async create(@Body() dto: CreatePlatformRevenueDto) {
        return this.revenueService.create(dto);
    }

    @Get()
    @RequirePermissions('owner.revenue.view')
    @ApiOperation({ summary: 'Get all platform revenue records' })
    async findAll(@Query() filters: PlatformRevenueFiltersDto) {
        return this.revenueService.findAll(filters);
    }

    @Get('stats')
    @RequirePermissions('owner.revenue.view')
    @ApiOperation({ summary: 'Get platform revenue statistics' })
    async getStats(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.revenueService.getStats(new Date(startDate), new Date(endDate));
    }
}
