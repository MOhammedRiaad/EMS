import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    @ApiOperation({ summary: 'List all clients for tenant' })
    findAll(@TenantId() tenantId: string) {
        return this.clientsService.findAll(tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get client by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new client' })
    create(@Body() dto: CreateClientDto, @TenantId() tenantId: string) {
        return this.clientsService.create(dto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a client' })
    update(@Param('id') id: string, @Body() dto: UpdateClientDto, @TenantId() tenantId: string) {
        return this.clientsService.update(id, dto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a client (soft delete)' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.remove(id, tenantId);
    }
}
