import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Get()
    @ApiOperation({ summary: 'List rooms (all or by studio)' })
    @ApiQuery({ name: 'studioId', required: false })
    findAll(@Query('studioId') studioId: string, @TenantId() tenantId: string) {
        if (studioId) {
            return this.roomsService.findByStudio(studioId, tenantId);
        }
        return this.roomsService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get room by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.roomsService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new room' })
    create(@Body() dto: CreateRoomDto, @TenantId() tenantId: string) {
        return this.roomsService.create(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a room' })
    update(@Param('id') id: string, @Body() dto: UpdateRoomDto, @TenantId() tenantId: string) {
        return this.roomsService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a room (soft delete)' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.roomsService.remove(id, tenantId);
    }
}
