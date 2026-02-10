import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('whatsapp')
@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get()
  @ApiOperation({ summary: 'Verify WhatsApp webhook' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log(
      `Received webhook verification request: mode=${mode}, token=${token}, challenge=${challenge}`,
    );
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WhatsApp webhook events' })
  async handleWebhook(@Body() body: any) {
    // this.logger.debug(`Received webhook event: ${JSON.stringify(body)}`);
    return this.whatsappService.handleWebhook(body);
  }
}
