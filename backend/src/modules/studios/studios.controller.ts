import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StudiosService } from './studios.service';
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
}
