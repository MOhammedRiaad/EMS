import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard, RolesGuard, Roles } from '../../common/guards';
import { TenantId } from '../../common/decorators';
import { AnalyticsService } from './analytics.service';
import { DateRangeQueryDto, RevenueQueryDto, PeriodType } from './dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles('tenant_owner', 'admin')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ============= Revenue Endpoints =============

  @Get('revenue/summary')
  @ApiOperation({ summary: 'Get revenue summary (total, MTD, YTD)' })
  getRevenueSummary(@TenantId() tenantId: string) {
    return this.analyticsService.getRevenueSummary(tenantId);
  }

  @Get('revenue/by-period')
  @ApiOperation({ summary: 'Get revenue breakdown by period' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'period', required: false, enum: PeriodType })
  getRevenueByPeriod(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getRevenueByPeriod(tenantId, query);
  }

  @Get('revenue/by-package')
  @ApiOperation({ summary: 'Get revenue breakdown by package' })
  getRevenueByPackage(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getRevenueByPackage(tenantId, query);
  }

  // ============= Client Endpoints =============

  @Get('clients/summary')
  @ApiOperation({ summary: 'Get client counts summary' })
  getClientSummary(@TenantId() tenantId: string) {
    return this.analyticsService.getClientSummary(tenantId);
  }

  @Get('clients/acquisition')
  @ApiOperation({ summary: 'Get client acquisition over time' })
  getClientAcquisition(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getClientAcquisition(tenantId, query);
  }

  @Get('clients/retention')
  @ApiOperation({ summary: 'Get client retention metrics' })
  getClientRetention(@TenantId() tenantId: string) {
    return this.analyticsService.getClientRetention(tenantId);
  }

  // ============= Coach Endpoints =============

  @Get('coaches/performance')
  @ApiOperation({ summary: 'Get coach performance metrics' })
  getCoachPerformance(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getCoachPerformance(tenantId, query);
  }

  @Get('coaches/ratings')
  @ApiOperation({ summary: 'Get coach ratings' })
  getCoachRatings(@TenantId() tenantId: string) {
    return this.analyticsService.getCoachRatings(tenantId);
  }

  // ============= Operations Endpoints =============

  @Get('operations/room-utilization')
  @ApiOperation({ summary: 'Get room utilization metrics' })
  getRoomUtilization(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getRoomUtilization(tenantId, query);
  }

  @Get('operations/device-utilization')
  @ApiOperation({ summary: 'Get device utilization metrics' })
  getDeviceUtilization(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getDeviceUtilization(tenantId, query);
  }

  @Get('operations/peak-hours')
  @ApiOperation({ summary: 'Get peak hours analysis' })
  getPeakHours(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getPeakHours(tenantId, query);
  }

  @Get('operations/heatmap')
  @ApiOperation({ summary: 'Get session utilization heatmap (day/hour)' })
  getUtilizationHeatmap(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getUtilizationHeatmap(tenantId, query);
  }

  // ============= Session Endpoints =============

  @Get('sessions/stats')
  @ApiOperation({ summary: 'Get session statistics' })
  getSessionStats(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getSessionStats(tenantId, query);
  }

  // ============= Financial Endpoints =============

  @Get('financial/cash-flow')
  @ApiOperation({ summary: 'Get cash flow over time' })
  getCashFlow(@TenantId() tenantId: string, @Query() query: DateRangeQueryDto) {
    return this.analyticsService.getCashFlow(tenantId, query);
  }

  @Get('financial/outstanding')
  @ApiOperation({ summary: 'Get outstanding payments' })
  getOutstandingPayments(@TenantId() tenantId: string) {
    return this.analyticsService.getOutstandingPayments(tenantId);
  }

  // ============= Waiting List Endpoints =============

  @Get('waiting-list/stats')
  @ApiOperation({ summary: 'Get waiting list statistics' })
  getWaitingListStats(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getWaitingListStats(tenantId, query);
  }

  // ============= Lead Endpoints =============

  @Get('leads/analytics')
  @ApiOperation({ summary: 'Get lead analytics (total, conversion, sources)' })
  getLeadAnalytics(
    @TenantId() tenantId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.analyticsService.getLeadAnalytics(tenantId, query);
  }

  // ============= Predictive Endpoints =============

  @Get('predictive/revenue-forecast')
  @ApiOperation({ summary: 'Get revenue forecast for next month' })
  getRevenueForecast(@TenantId() tenantId: string) {
    return this.analyticsService.getRevenueForecast(tenantId);
  }
}
