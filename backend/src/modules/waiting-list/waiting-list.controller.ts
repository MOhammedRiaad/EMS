import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { WaitingListService } from './waiting-list.service';
import { CreateWaitingListEntryDto, UpdateWaitingListEntryDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';
import { MailerService } from '../mailer/mailer.service';

@ApiTags('waiting-list')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('waiting-list')
export class WaitingListController {
    constructor(
        private readonly waitingListService: WaitingListService,
        private readonly mailerService: MailerService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Add entry to waiting list' })
    create(@Body() createDto: CreateWaitingListEntryDto, @TenantId() tenantId: string) {
        return this.waitingListService.create(createDto, tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all waiting list entries' })
    findAll(@TenantId() tenantId: string, @Query() query: any) {
        return this.waitingListService.findAll(tenantId, query);
    }

    @Get('my-entries')
    @ApiOperation({ summary: 'Get current user/client waiting list entries' })
    findMyEntries(@Request() req: any, @TenantId() tenantId: string) {
        // Assuming req.user.clientId exists if user is a client, or we use userId if it's linked
        // For now, let's assume this endpoint is for logged in clients
        // If req.user is an admin, they might not have a client ID
        // TODO: Refine how client ID is retrieved from user for "my entries"
        const clientId = req.user.clientId; // Verify if User entity has clientId mapped or if it's stored in JWT
        if (!clientId) {
            // Fallback or error if not a client
            return [];
        }
        return this.waitingListService.findByClient(clientId, tenantId);
    }

    @Get('client/:clientId')
    @ApiOperation({ summary: 'Get waiting list entries for a specific client' })
    findByClient(@Param('clientId') clientId: string, @TenantId() tenantId: string) {
        return this.waitingListService.findByClient(clientId, tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific waiting list entry' })
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waitingListService.findOne(id, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update waiting list entry' })
    update(@Param('id') id: string, @Body() updateDto: UpdateWaitingListEntryDto, @TenantId() tenantId: string) {
        return this.waitingListService.update(id, updateDto, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove entry from waiting list' })
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waitingListService.remove(id, tenantId);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve waiting list entry' })
    approve(@Param('id') id: string, @Request() req: any, @TenantId() tenantId: string) {
        return this.waitingListService.approve(id, req.user.id, tenantId);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject/Cancel waiting list entry' })
    reject(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waitingListService.reject(id, tenantId);
    }

    @Patch(':id/priority')
    @ApiOperation({ summary: 'Update priority of waiting list entry' })
    updatePriority(@Param('id') id: string, @Body('priority') priority: number, @TenantId() tenantId: string) {
        return this.waitingListService.updatePriority(id, priority, tenantId);
    }

    @Post(':id/notify')
    @ApiOperation({ summary: 'Notify client about available spot' })
    notifyClient(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waitingListService.notifyClient(id, tenantId, this.mailerService);
    }

    @Patch(':id/book')
    @ApiOperation({ summary: 'Mark entry as booked' })
    markAsBooked(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.waitingListService.markAsBooked(id, tenantId);
    }
}
