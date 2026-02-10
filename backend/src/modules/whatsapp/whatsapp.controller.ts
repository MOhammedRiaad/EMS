import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import type { WhatsAppConfig } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { TenantId } from '../../common/decorators';

@Controller('tenants/whatsapp')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('config')
  @Roles('admin', 'owner', 'tenant_owner')
  async getConfig(@Req() req: any) {
    // This is handled via tenants service usually, but we can provide a shortcut
    // or mask values here.
    return { enabled: false }; // Placeholder as it's usually inside settings
  }

  @Post('test-connection')
  @Roles('admin', 'owner', 'tenant_owner')
  async testConnection(@Body() config: WhatsAppConfig) {
    const isValid = await this.whatsappService.validateConfiguration(config);
    return { success: isValid };
  }

  @Post('send')
  @Roles('admin', 'owner', 'tenant_owner', 'manager')
  async sendMessage(
    @Body() body: { to: string; message: string },
    @TenantId() tenantId: string,
  ) {
    return this.whatsappService.sendFreeFormMessage(
      tenantId,
      body.to,
      body.message,
    );
  }
}
