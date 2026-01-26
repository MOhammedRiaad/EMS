import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CoachesService } from './coaches.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('coaches')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('coaches')
export class CoachesController {
    constructor(private readonly coachesService: CoachesService) { }

    @Get()
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(300000) // 5 minutes
    @ApiOperation({ summary: 'List all coaches or by studio' })
    @ApiQuery({ name: 'studioId', required: false })
    findAll(@Query('studioId') studioId: string, @TenantId() tenantId: string) {
        if (studioId) {
            return this.coachesService.findByStudio(studioId, tenantId);
        }
        return this.coachesService.findAll(tenantId);
    }

    @Get(':id')
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(300000) // 5 minutes
    @ApiOperation({ summary: 'Get a coach by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.coachesService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new coach' })
    create(@Body() dto: CreateCoachDto, @TenantId() tenantId: string) {
        return this.coachesService.create(dto, tenantId);
    }

    @Post('create-with-user')
    @ApiOperation({ summary: 'Create coach with user account' })
    createWithUser(@Body() dto: any, @TenantId() tenantId: string) {
        return this.coachesService.createWithUser(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a coach' })
    update(@Param('id') id: string, @Body() dto: UpdateCoachDto, @TenantId() tenantId: string) {
        return this.coachesService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a coach (soft delete)' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.coachesService.remove(id, tenantId);
    }
}
