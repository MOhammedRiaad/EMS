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
import { TenantCacheInterceptor } from '../../common/interceptors';
import { CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CoachesService } from './coaches.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import {
  CheckPlanLimit,
  PlanLimitGuard,
} from '../owner/guards/plan-limit.guard';

@ApiTags('coaches')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PlanLimitGuard)
@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) { }

  @Get()
  @UseInterceptors(TenantCacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @ApiOperation({ summary: 'List all coaches or by studio' })
  @ApiQuery({ name: 'studioId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('studioId') studioId: string,
    @Query('search') search: string,
    @TenantId() tenantId: string,
  ) {
    if (studioId) {
      return this.coachesService.findByStudio(studioId, tenantId);
    }
    return this.coachesService.findAll(tenantId, search);
  }

  @Get(':id')
  @UseInterceptors(TenantCacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @ApiOperation({ summary: 'Get a coach by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coachesService.findOne(id, tenantId);
  }

  @Post()
  @Roles('admin', 'tenant_owner')
  @CheckPlanLimit('coaches')
  @ApiOperation({ summary: 'Create a new coach' })
  create(@Body() dto: CreateCoachDto, @TenantId() tenantId: string) {
    return this.coachesService.create(dto, tenantId);
  }

  @Post('create-with-user')
  @Roles('admin', 'tenant_owner')
  @CheckPlanLimit('coaches')
  @ApiOperation({ summary: 'Create coach with user account' })
  createWithUser(@Body() dto: any, @TenantId() tenantId: string) {
    return this.coachesService.createWithUser(dto, tenantId);
  }

  @Patch(':id')
  @Roles('admin', 'tenant_owner', 'coach')
  @ApiOperation({ summary: 'Update a coach' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCoachDto,
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('admin', 'tenant_owner')
  @ApiOperation({ summary: 'Delete a coach (soft delete)' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coachesService.remove(id, tenantId);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get coach availability rules' })
  getAvailability(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coachesService.getAvailability(id, tenantId);
  }

  @Patch(':id/availability')
  @Roles('admin', 'tenant_owner', 'coach')
  @ApiOperation({ summary: 'Update coach availability rules' })
  updateAvailability(
    @Param('id') id: string,
    @Body() rules: any[],
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.coachesService.updateAvailability(
      id,
      rules,
      tenantId,
      req.user,
    );
  }

  // ============ Time-Off Request Endpoints ============

  @Get('time-off/requests')
  @ApiOperation({ summary: 'List all time-off requests (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'coachId', required: false })
  getTimeOffRequests(
    @Query('status') status: string,
    @Query('coachId') coachId: string,
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.getTimeOffRequests(
      tenantId,
      status as 'pending' | 'approved' | 'rejected' | undefined,
      coachId,
    );
  }

  @Post(':id/time-off')
  @ApiOperation({ summary: 'Create a time-off request for a coach' })
  createTimeOffRequest(
    @Param('id') coachId: string,
    @Body() dto: { startDate: string; endDate: string; notes?: string },
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.createTimeOffRequest(coachId, dto, tenantId);
  }

  @Get(':id/time-off')
  @ApiOperation({ summary: 'Get time-off requests for a specific coach' })
  getCoachTimeOffRequests(
    @Param('id') coachId: string,
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.getCoachTimeOffRequests(coachId, tenantId);
  }

  @Patch('time-off/:requestId/approve')
  @ApiOperation({ summary: 'Approve a time-off request' })
  approveTimeOff(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.updateTimeOffStatus(
      requestId,
      'approved',
      req.user.id,
      tenantId,
    );
  }

  @Patch('time-off/:requestId/reject')
  @ApiOperation({ summary: 'Reject a time-off request' })
  rejectTimeOff(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @TenantId() tenantId: string,
  ) {
    return this.coachesService.updateTimeOffStatus(
      requestId,
      'rejected',
      req.user.id,
      tenantId,
    );
  }
}
