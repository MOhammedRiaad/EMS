import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTicketDto, CreateMessageDto, UpdateTicketStatusDto } from './dto/index';

@Controller('support')
@UseGuards(AuthGuard('jwt'))
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Post('tickets')
    create(@Request() req: any, @Body() dto: CreateTicketDto) {
        return this.supportService.createTicket(req.user, dto);
    }

    @Get('tickets')
    findAll(@Request() req: any) {
        return this.supportService.findAll(req.user);
    }

    @Get('tickets/:id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.supportService.findOne(id, req.user);
    }

    @Post('tickets/:id/messages')
    createMessage(@Request() req: any, @Param('id') id: string, @Body() dto: CreateMessageDto) {
        return this.supportService.createMessage(id, req.user, dto);
    }

    @Patch('tickets/:id/status')
    updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
        return this.supportService.updateStatus(id, req.user, dto);
    }
}
