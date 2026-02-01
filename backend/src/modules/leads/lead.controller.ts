import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadService } from './lead.service';
import { TenantId, CurrentUser } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';
import { User } from '../auth/entities/user.entity';

@Controller('leads')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class LeadController {
    constructor(private readonly leadService: LeadService) { }

    @Post()
    create(@Body() createLeadDto: any, @TenantId() tenantId: string, @CurrentUser() user: User) {
        return this.leadService.create(createLeadDto, tenantId, user);
    }

    @Get()
    findAll(@Query() query: any, @TenantId() tenantId: string) {
        return this.leadService.findAll(query, tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.leadService.findOne(id, tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLeadDto: any, @TenantId() tenantId: string, @CurrentUser() user: User) {
        return this.leadService.update(id, updateLeadDto, tenantId, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.leadService.remove(id, tenantId);
    }

    @Post(':id/activities')
    addActivity(@Param('id') id: string, @Body() body: { type: any, content: string }, @CurrentUser() user: User) {
        return this.leadService.addActivity(id, body.type, body.content, user);
    }

    @Post(':id/convert')
    convert(@Param('id') id: string, @CurrentUser() user: User) {
        return this.leadService.convertToClient(id, user);
    }
}
