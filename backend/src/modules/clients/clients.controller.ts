import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
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
}
