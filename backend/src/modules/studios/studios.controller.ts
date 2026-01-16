import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StudiosService } from './studios.service';
import { CreateStudioDto, UpdateStudioDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('studios')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('studios')
export class StudiosController {
    constructor(private readonly studiosService: StudiosService) { }

    @Get()
    @ApiOperation({ summary: 'List all studios for tenant' })
    findAll(@TenantId() tenantId: string) {
        return this.studiosService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get studio by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.studiosService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new studio' })
    create(@Body() dto: CreateStudioDto, @TenantId() tenantId: string) {
        return this.studiosService.create(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a studio' })
    update(@Param('id') id: string, @Body() dto: UpdateStudioDto, @TenantId() tenantId: string) {
        return this.studiosService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a studio (soft delete)' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.studiosService.remove(id, tenantId);
    }
}
