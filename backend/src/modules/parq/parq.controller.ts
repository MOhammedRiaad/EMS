import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ParqService } from './parq.service';
import { CreateParqDto } from './dto/create-parq.dto';

@ApiTags('parq')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('parq')
export class ParqController {
    constructor(private readonly parqService: ParqService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a new PAR-Q response' })
    create(@Request() req: any, @Body() dto: CreateParqDto) {
        return this.parqService.create(req.user.tenantId, dto);
    }

    @Get('latest/:clientId')
    @ApiOperation({ summary: 'Get latest PAR-Q for a client' })
    getLatest(@Request() req: any, @Param('clientId') clientId: string) {
        return this.parqService.getLatest(req.user.tenantId, clientId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all PAR-Q responses' })
    findAll(@Request() req: any) {
        return this.parqService.findAll(req.user.tenantId);
    }
}
