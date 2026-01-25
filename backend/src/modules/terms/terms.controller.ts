import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TermsService } from './terms.service';
import { CreateTermsDto, AcceptTermsDto } from './dto/terms.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('terms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('terms')
export class TermsController {
    constructor(private readonly termsService: TermsService) { }

    @Post()
    @ApiOperation({ summary: 'Publish new terms of service (Admin)' })
    create(@Request() req: any, @Body() dto: CreateTermsDto) {
        // In real app, check for ADMIN role
        return this.termsService.create(req.user.tenantId, dto);
    }

    @Get('active')
    @ApiOperation({ summary: 'Get currently active terms' })
    getActive(@Request() req: any) {
        return this.termsService.getActive(req.user.tenantId);
    }

    @Get('status')
    @ApiOperation({ summary: 'Check if current client has accepted active terms' })
    checkStatus(@Request() req: any) {
        return this.termsService.checkStatus(req.user.tenantId, req.user.id);
    }

    @Post('accept')
    @ApiOperation({ summary: 'Accept terms' })
    accept(@Request() req: any, @Body() dto: AcceptTermsDto) {
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
        const userAgent = req.headers['user-agent'];
        return this.termsService.accept(req.user.tenantId, req.user.id, dto.termsId, ip, userAgent);
    }
}
