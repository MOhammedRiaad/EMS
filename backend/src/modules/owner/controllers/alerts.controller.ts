import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AlertsService } from '../services/alerts.service';
import type {
  Alert,
  AlertSeverity,
  AlertCategory,
} from '../services/alerts.service';
import { RequirePermissions } from '../guards/permission.guard';

@ApiTags('owner/alerts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('owner/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @RequirePermissions('owner.alerts.view')
  @ApiOperation({ summary: 'Get all alerts with optional filters' })
  @ApiQuery({
    name: 'severity',
    required: false,
    enum: ['info', 'warning', 'critical'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['usage', 'system', 'billing', 'security'],
  })
  @ApiQuery({ name: 'acknowledged', required: false, type: Boolean })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAlerts(
    @Query('severity') severity?: AlertSeverity,
    @Query('category') category?: AlertCategory,
    @Query('acknowledged') acknowledged?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ): Promise<Alert[]> {
    return this.alertsService.getAlerts({
      severity,
      category,
      acknowledged:
        acknowledged !== undefined ? acknowledged === 'true' : undefined,
      tenantId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('counts')
  @RequirePermissions('owner.alerts.view')
  @ApiOperation({ summary: 'Get alert counts by severity' })
  async getAlertCounts() {
    return this.alertsService.getAlertCounts();
  }

  @Get('unacknowledged')
  @RequirePermissions('owner.alerts.view')
  @ApiOperation({ summary: 'Get unacknowledged alerts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUnacknowledgedAlerts(
    @Query('limit') limit?: string,
  ): Promise<Alert[]> {
    return this.alertsService.getAlerts({
      acknowledged: false,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post(':id/acknowledge')
  @RequirePermissions('owner.alerts.manage')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(@Param('id') id: string, @Request() req: any) {
    const alert = this.alertsService.acknowledgeAlert(id, req.user.id);
    if (!alert) {
      return { success: false, message: 'Alert not found' };
    }
    return { success: true, alert };
  }

  @Post('acknowledge-all')
  @RequirePermissions('owner.alerts.manage')
  @ApiOperation({ summary: 'Acknowledge multiple alerts' })
  async acknowledgeAllAlerts(
    @Body()
    filters: {
      severity?: AlertSeverity;
      category?: AlertCategory;
      tenantId?: string;
    },
    @Request() req: any,
  ) {
    const count = this.alertsService.acknowledgeAlerts(filters, req.user.id);
    return { success: true, acknowledged: count };
  }

  @Post('trigger-check')
  @RequirePermissions('owner.system.manage')
  @ApiOperation({ summary: 'Manually trigger threshold checks' })
  async triggerCheck() {
    await this.alertsService.checkUsageThresholds();
    return { success: true, message: 'Threshold check triggered' };
  }
}
