import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutomationService } from './automation.service';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@Controller('marketing/automations')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  create(@Body() createDto: any, @TenantId() tenantId: string) {
    return this.automationService.create(createDto, tenantId);
  }

  @Get('executions')
  findAllExecutions(@TenantId() tenantId: string) {
    return this.automationService.findAllExecutions(tenantId);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.automationService.findAll(tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @TenantId() tenantId: string,
  ) {
    return this.automationService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.automationService.delete(id, tenantId);
  }
}
