import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, SessionQueryDto, UpdateSessionStatusDto, UpdateSessionDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Get()
    // Cache disabled to prevent stale data after status updates
    @ApiOperation({ summary: 'List sessions with filters' })
    findAll(@Query() query: SessionQueryDto, @TenantId() tenantId: string) {
        return this.sessionsService.findAll(tenantId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get session by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.sessionsService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new session (with conflict checking)' })
    create(@Body() dto: CreateSessionDto, @TenantId() tenantId: string) {
        return this.sessionsService.create(dto, tenantId);
    }

    @Post('check-conflicts')
    @ApiOperation({ summary: 'Check for scheduling conflicts without creating' })
    checkConflicts(@Body() dto: CreateSessionDto, @TenantId() tenantId: string) {
        return this.sessionsService.checkConflicts(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a session' })
    update(@Param('id') id: string, @Body() dto: UpdateSessionDto, @TenantId() tenantId: string) {
        return this.sessionsService.update(id, dto, tenantId);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update session status' })
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateSessionStatusDto,
        @TenantId() tenantId: string,
    ) {
        return this.sessionsService.updateStatus(id, tenantId, dto.status, dto.deductSession);
    }
}
