import {
    Injectable,
    Logger,
    HttpException,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { TenantsService } from '../tenants/tenants.service';

export interface WhatsAppConfig {
    provider: 'meta' | 'wrapper';
    enabled: boolean;
    reminderEnabled?: boolean;
    reminderTime?: string; // e.g., "10:00"
    config: {
        // Meta specific
        phoneNumberId?: string;
        businessAccountId?: string;
        accessToken?: string;
        // Wrapper specific (Whapi/UltraMsg/etc)
        apiUrl?: string;
        token?: string;
    };
}

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);

    constructor(
        private readonly tenantsService: TenantsService,
        private readonly featureFlagService: FeatureFlagService,
    ) { }

    async sendTemplateMessage(
        tenantId: string,
        to: string,
        templateName: string,
        components: any[],
    ): Promise<any> {
        const config = await this.getTenantConfig(tenantId);

        // Check feature flag
        const isFeatureEnabled = await this.featureFlagService.isFeatureEnabled(tenantId, 'core.whatsapp');
        if (!isFeatureEnabled) {
            this.logger.warn(`WhatsApp feature not enabled for tenant ${tenantId}`);
            return;
        }

        if (!config || !config.enabled || config.provider !== 'meta') {
            this.logger.warn(
                `WhatsApp Meta provider not configured for tenant ${tenantId}`,
            );
            return;
        }

        const { phoneNumberId, accessToken } = config.config;
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'en_US' },
                        components,
                    },
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.error?.message || 'Meta API error';
                this.logger.error(`Meta API Error (Template): ${errorMessage}`);
                throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
            }
            return data;
        } catch (error) {
            this.logger.error(
                `Failed to send WhatsApp template message: ${error.message}`,
            );
            throw error;
        }
    }

    async sendFreeFormMessage(
        tenantId: string,
        to: string,
        text: string,
    ): Promise<any> {
        const config = await this.getTenantConfig(tenantId);

        // Check feature flag
        const isFeatureEnabled = await this.featureFlagService.isFeatureEnabled(tenantId, 'core.whatsapp');
        if (!isFeatureEnabled) {
            this.logger.warn(`WhatsApp feature not enabled for tenant ${tenantId}`);
            return;
        }

        if (!config || !config.enabled) {
            this.logger.warn(`WhatsApp not configured for tenant ${tenantId}`);
            return;
        }

        if (config.provider === 'meta') {
            // Session message window check would happen here in a real scenario
            // For now, we attempt to send a text message
            return this.sendMetaTextMessage(config, to, text);
        } else {
            return this.sendWrapperTextMessage(config, to, text);
        }
    }

    private async sendMetaTextMessage(
        config: WhatsAppConfig,
        to: string,
        text: string,
    ) {
        const { phoneNumberId, accessToken } = config.config;
        const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            const errorMessage = data.error?.message || 'Meta API error';
            this.logger.error(`Meta API Error: ${errorMessage}`);
            throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
        }
        return data;
    }

    private async sendWrapperTextMessage(
        config: WhatsAppConfig,
        to: string,
        text: string,
    ) {
        const { apiUrl, token } = config.config;
        // Generic wrapper implementation (most use POST with a token header or param)
        // We'll assume a common pattern: POST to /messages with JSON body

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['x-api-token'] = token;
        }

        const response = await fetch(`${apiUrl}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                to,
                text,
                // Some providers use body instead of text
                body: text,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Wrapper API error';
            this.logger.error(`Wrapper API Error: ${errorMessage}`);
            throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
        }
        return data;
    }

    private async getTenantConfig(
        tenantId: string,
    ): Promise<WhatsAppConfig | null> {
        const tenant = await this.tenantsService.findOne(tenantId);
        return tenant?.settings?.whatsappConfig || null;
    }

    async validateConfiguration(config: WhatsAppConfig): Promise<boolean> {
        // Basic connectivity test
        // For Meta, we could fetch phone number info
        // For Wrapper, we could fetch status
        return true; // Mocked for now
    }

    verifyWebhook(mode: string, token: string, challenge: string): string {
        const verifyToken =
            process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'ems-studio-webhook-verify';

        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('Webhook verified successfully');
            return challenge;
        }

        this.logger.warn(
            `Webhook verification failed. Expected: ${verifyToken}, Received: ${token}`,
        );
        throw new ForbiddenException('Invalid verify token');
    }

    async handleWebhook(body: any) {
        // Basic processing to acknowledge receipt
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from;
                const msgBody = message.text?.body;
                this.logger.log(`Received WhatsApp message from ${from}: ${msgBody}`);
                // Future: Emit event for other modules to consume
            }
        }
        return { status: 'success' };
    }
}
