import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from './rooms.service';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Get()
    @ApiOperation({ summary: 'List rooms by studio' })
    findByStudio(@Query('studioId') studioId: string, @TenantId() tenantId: string) {
        return this.roomsService.findByStudio(studioId, tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get room by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.roomsService.findOne(id, tenantId);
    }
}
