import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { TenantGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @ApiOperation({ summary: 'Get audit logs' })
    findAll(@TenantId() tenantId: string, @Query('limit') limit?: number) {
        return this.auditService.findAll(tenantId, limit || 100);
    }
}
