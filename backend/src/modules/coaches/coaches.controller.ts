import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
    @ApiOperation({ summary: 'List all coaches or by studio' })
    @ApiQuery({ name: 'studioId', required: false })
    findAll(@Query('studioId') studioId: string, @TenantId() tenantId: string) {
        if (studioId) {
            return this.coachesService.findByStudio(studioId, tenantId);
        }
        return this.coachesService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a coach by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.coachesService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new coach' })
    create(@Body() dto: CreateCoachDto, @TenantId() tenantId: string) {
        return this.coachesService.create(dto, tenantId);
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
