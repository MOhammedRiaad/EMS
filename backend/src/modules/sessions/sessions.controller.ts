import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';
import {
  CreateSessionDto,
  SessionQueryDto,
  UpdateSessionStatusDto,
  UpdateSessionDto,
  BulkCreateSessionDto,
} from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  CheckPlanLimit,
  PlanLimitGuard,
} from '../owner/guards/plan-limit.guard';

import { SessionParticipantsService } from './session-participants.service';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PlanLimitGuard)
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly participantsService: SessionParticipantsService,
  ) {}

  @Get()
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(60000) // 1 minute
  @ApiOperation({ summary: 'List sessions with filters' })
  findAll(@Query() query: SessionQueryDto, @TenantId() tenantId: string) {
    return this.sessionsService.findAll(tenantId, query);
  }

  @Get(':id')
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(60000) // 1 minute
  @ApiOperation({ summary: 'Get session by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.sessionsService.findOne(id, tenantId);
  }

  @Post()
  @CheckPlanLimit('sessions')
  @ApiOperation({ summary: 'Create a new session (with conflict checking)' })
  create(
    @Body() dto: CreateSessionDto,
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.create(dto, tenantId, req.user);
  }

  @Post('check-conflicts')
  @ApiOperation({ summary: 'Check for scheduling conflicts without creating' })
  checkConflicts(@Body() dto: CreateSessionDto, @TenantId() tenantId: string) {
    return this.sessionsService.checkConflicts(dto, tenantId);
  }

  @Post('bulk')
  @Roles('admin', 'tenant_owner')
  @CheckPlanLimit('sessions')
  @ApiOperation({ summary: 'Bulk create sessions' })
  createBulk(
    @Body() dto: BulkCreateSessionDto,
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.createBulk(dto, tenantId, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a session' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.update(id, dto, tenantId, req.user);
  }

  @Patch(':id/series')
  @ApiOperation({ summary: 'Update a session series' })
  updateSeries(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @TenantId() tenantId: string,
  ) {
    return this.sessionsService.updateSeries(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('admin', 'tenant_owner')
  @ApiOperation({ summary: 'Delete a session' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.sessionsService.delete(id, tenantId);
  }

  @Delete(':id/series')
  @Roles('admin', 'tenant_owner')
  @ApiOperation({ summary: 'Delete a session series' })
  deleteSeries(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.sessionsService.deleteSeries(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update session status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.sessionsService.updateStatus(
      id,
      tenantId,
      dto.status,
      dto.deductSession,
      req.user?.id || 'API_USER',
    );
  }

  // ===== Participant Endpoints =====

  @Post(':id/participants/:clientId')
  @ApiOperation({ summary: 'Add a client to a group session' })
  addParticipant(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
    @TenantId() tenantId: string,
  ) {
    // Can inject SessionParticipantsService as private property or via constructor
    // But constructor needs update.
    // Better to update constructor.
    return this.participantsService.addParticipant(id, clientId, tenantId);
  }

  @Patch(':id/participants/:clientId/status')
  @ApiOperation({ summary: 'Update participant status' })
  updateParticipantStatus(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
    @Body('status') status: 'completed' | 'no_show' | 'cancelled',
    @TenantId() tenantId: string,
  ) {
    return this.participantsService.updateStatus(
      id,
      clientId,
      status,
      tenantId,
    );
  }

  @Post(':id/participants/:clientId/remove')
  @ApiOperation({ summary: 'Remove a client from a group session' })
  removeParticipant(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
    @TenantId() tenantId: string,
  ) {
    return this.participantsService.removeParticipant(id, clientId, tenantId);
  }
}
