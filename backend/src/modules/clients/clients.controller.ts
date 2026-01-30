import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { TenantId, CurrentUser } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

import { WaiversService } from '../waivers/waivers.service';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('clients')
export class ClientsController {
    constructor(
        private readonly clientsService: ClientsService,
        private readonly waiversService: WaiversService
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all clients for tenant' })
    findAll(@TenantId() tenantId: string, @Query('search') search?: string) {
        return this.clientsService.findAll(tenantId, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get client by ID' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.findOne(id, tenantId);
    }

    @Get(':id/waivers')
    @ApiOperation({ summary: 'Get client signed waivers' })
    getWaivers(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waiversService.getSignedWaiversForClient(tenantId, id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new client' })
    create(@Body() dto: CreateClientDto, @TenantId() tenantId: string) {
        return this.clientsService.create(dto, tenantId);
    }

    @Post('create-with-user')
    @ApiOperation({ summary: 'Create client with user account' })
    createWithUser(@Body() dto: any, @TenantId() tenantId: string) {
        return this.clientsService.createWithUser(dto, tenantId);
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

    @Post(':id/invite')
    @ApiOperation({ summary: 'Invite client to portal (create user + email)' })
    invite(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.invite(id, tenantId);
    }

    @Get(':id/transactions')
    @ApiOperation({ summary: 'Get client transaction history' })
    getTransactions(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.getTransactions(id, tenantId);
    }

    @Post(':id/balance')
    @ApiOperation({ summary: 'Adjust client balance (Add/Remove funds)' })
    adjustBalance(
        @Param('id') id: string,
        @Body() body: { amount: number; description: string },
        @TenantId() tenantId: string,
        @CurrentUser() user: any
    ) {
        return this.clientsService.adjustBalance(id, tenantId, body.amount, body.description, user.id);
    }

    @Post(':id/photos')
    @ApiOperation({ summary: 'Add progress photo' })
    addPhoto(
        @Param('id') id: string,
        @Body() dto: CreateProgressPhotoDto,
        @TenantId() tenantId: string
    ) {
        return this.clientsService.addProgressPhoto(id, dto, tenantId);
    }

    @Get(':id/photos')
    @ApiOperation({ summary: 'Get client progress photos' })
    getPhotos(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.clientsService.getProgressPhotos(id, tenantId);
    }

    @Delete(':id/photos/:photoId')
    @ApiOperation({ summary: 'Delete progress photo' })
    deletePhoto(
        @Param('id') id: string,
        @Param('photoId') photoId: string,
        @TenantId() tenantId: string
    ) {
        return this.clientsService.deleteProgressPhoto(id, photoId, tenantId);
    }
}
