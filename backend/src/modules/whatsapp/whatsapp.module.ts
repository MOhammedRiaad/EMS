import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppWebhookController } from './whatsapp.webhook.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { OwnerModule } from '../owner/owner.module';

@Module({
  imports: [forwardRef(() => TenantsModule), forwardRef(() => OwnerModule)],
  controllers: [WhatsAppController, WhatsAppWebhookController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
// Updated for Webhook
export class WhatsAppModule { }
