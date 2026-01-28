import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeadService } from './lead.service';
import { User } from '../auth/entities/user.entity';

@Controller('leads')
@UseGuards(AuthGuard('jwt'))
export class LeadController {
    constructor(private readonly leadService: LeadService) { }

    @Post()
    create(@Body() createLeadDto: any, @Req() req: any) {
        return this.leadService.create(createLeadDto, req.user);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.leadService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leadService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLeadDto: any, @Req() req: any) {
        return this.leadService.update(id, updateLeadDto, req.user);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.leadService.remove(id);
    }

    @Post(':id/activities')
    addActivity(@Param('id') id: string, @Body() body: { type: any, content: string }, @Req() req: any) {
        return this.leadService.addActivity(id, body.type, body.content, req.user);
    }

    @Post(':id/convert')
    convert(@Param('id') id: string, @Req() req: any) {
        return this.leadService.convertToClient(id, req.user);
    }
}
