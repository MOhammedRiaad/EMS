import { Controller, Get, Post, Body, UseGuards, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WaiversService } from './waivers.service';
import { SignWaiverDto } from './dto/sign-waiver.dto';
import { TenantId, CurrentUser } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('waivers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('waivers')
export class WaiversController {
    constructor(private readonly waiversService: WaiversService) { }

    @Get('latest')
    @ApiOperation({ summary: 'Get the latest active waiver content' })
    getLatest(@TenantId() tenantId: string) {
        return this.waiversService.getLatestWaiver(tenantId);
    }

    @Get('status')
    @ApiOperation({ summary: 'Check if current user has signed the latest waiver' })
    checkStatus(@TenantId() tenantId: string, @CurrentUser() user: any) {
        return this.waiversService.getClientSignatureStatus(tenantId, user.id);
    }

    @Post('sign')
    @ApiOperation({ summary: 'Sign a waiver' })
    sign(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() dto: SignWaiverDto,
        @Ip() ip: string,
        @Req() req: any
    ) {
        return this.waiversService.signWaiver(tenantId, user.id, dto, ip, req.headers['user-agent']);
    }
}
