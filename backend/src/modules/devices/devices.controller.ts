import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Get()
    @ApiOperation({ summary: 'List all devices or by studio' })
    @ApiQuery({ name: 'studioId', required: false })
    @ApiQuery({ name: 'available', required: false, description: 'Filter only available devices' })
    findAll(
        @Query('studioId') studioId: string,
        @Query('available') available: string,
        @TenantId() tenantId: string
    ) {
        if (studioId && available === 'true') {
            return this.devicesService.findAvailableByStudio(studioId, tenantId);
        }
        if (studioId) {
            return this.devicesService.findByStudio(studioId, tenantId);
        }
        return this.devicesService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get device by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.devicesService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new EMS device' })
    create(@Body() dto: CreateDeviceDto, @TenantId() tenantId: string) {
        return this.devicesService.create(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a device' })
    update(@Param('id') id: string, @Body() dto: UpdateDeviceDto, @TenantId() tenantId: string) {
        return this.devicesService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a device' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.devicesService.remove(id, tenantId);
    }
}
