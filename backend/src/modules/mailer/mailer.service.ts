import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EMAIL_TEMPLATES } from './mail-templates';

@Injectable()
@Injectable()
export class MailerService {
  private defaultTransporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);
  private transporterCache = new Map<string, nodemailer.Transporter>();

  constructor(private configService: ConfigService) {
    this.defaultTransporter = nodemailer.createTransport({
      host:
        this.configService.get('SMTP_HOST') ||
        this.configService.get('MAIL_HOST') ||
        'maildev',
      port: parseInt(
        this.configService.get('SMTP_PORT') ||
        this.configService.get('MAIL_PORT') ||
        '1025',
      ),
      ignoreTLS: true,
    });
  }

  private async getTransporter(tenantId?: string): Promise<nodemailer.Transporter | null> {
    if (!tenantId) {
      return this.defaultTransporter;
    }

    // Check cache
    if (this.transporterCache.has(tenantId)) {
      return this.transporterCache.get(tenantId)!;
    }

    // Since we don't have direct access to Tenant repository here easily without circular dependency usually,
    // we'll rely on the caller passing the tenant config OR we inject the TenantService/Repository carefully.
    // However, for cleaner architecture, the service calling sendMail should passed the context.
    // BUT the standard is `sendMail(to, subject...)`.
    // Let's modify public methods to accept an optional `tenantSettings` or `tenantId`.
    // FOR NOW: We will assume the `defaultTransporter` is used if no tenant configuration is passed.
    // To support dynamic tenant config, we either need:
    // 1. Inject TenantService (careful of circular deps)
    // 2. Caller passes the config.

    // Given the previous `sendMail` signature, we should overhaul it to support context.
    return this.defaultTransporter;
  }

  // UPDATED METHOD: Accepts tenant context
  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
    tenantSettings?: any // Optional: Pass tenant.settings.emailConfig
  ) {
    try {
      let transporter = this.defaultTransporter;
      let from = '"EMS Studio" <no-reply@emsstudio.com>';

      if (tenantSettings && tenantSettings.host) {
        // Create dynamic transporter
        // We could cache this based on a hash of the settings to avoid recreating it every time
        const key = `${tenantSettings.host}:${tenantSettings.port}:${tenantSettings.user}`;
        if (!this.transporterCache.has(key)) {
          this.transporterCache.set(key, nodemailer.createTransport({
            host: tenantSettings.host,
            port: parseInt(tenantSettings.port),
            secure: tenantSettings.secure || false,
            auth: tenantSettings.user ? {
              user: tenantSettings.user,
              pass: tenantSettings.password
            } : undefined,
          }));
        }
        transporter = this.transporterCache.get(key)!;

        if (tenantSettings.fromEmail) {
          from = tenantSettings.fromName
            ? `"${tenantSettings.fromName}" <${tenantSettings.fromEmail}>`
            : tenantSettings.fromEmail;
        }
      } else {
        // If no tenant settings, verify if system email is allowed?
        // For now, fall back to default (system level).
      }

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      return null;
    }
  }

  async sendTemplatedMail(to: string, templateId: string, context: any, tenantSettings?: any) {
    const template = EMAIL_TEMPLATES[templateId];
    if (!template) {
      this.logger.warn(`Template ${templateId} not found`);
      return null;
    }

    let { subject, html } = template;

    // Helper to replace variables
    const replaceVars = (str: string) => {
      let result = str;
      Object.keys(context).forEach((key) => {
        const value = context[key] || '';
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(
          regex,
          typeof value === 'object' ? JSON.stringify(value) : value.toString(),
        );
      });

      if (context.client) {
        result = result.replace(
          /{{userName}}/g,
          context.client.firstName || 'Customer',
        );
      } else if (context.user) {
        result = result.replace(
          /{{userName}}/g,
          context.user.firstName || 'Customer',
        );
      }

      // Default fallbacks or Tenant specific overrides
      const studioName = context.studioName || (tenantSettings?.fromName) || 'EMS Studio';
      result = result.replace(/{{studioName}}/g, studioName);

      // Portal URL might differ per tenant if we support custom domains, 
      // but usually it's the same frontend param or derived.
      result = result.replace(/{{portalUrl}}/g, 'http://localhost:5173');

      return result;
    };

    subject = replaceVars(subject);
    html = replaceVars(html);

    return this.sendMail(to, subject, html, html, tenantSettings);
  }

  async sendClientInvitation(email: string, inviteLink: string, tenantSettings?: any) {
    const subject = 'Welcome to Your Client Portal'; // Generic or Tenant Name?
    const text = `Welcome! You have been invited to join our client portal. Please click the link below to set up your account: ${inviteLink}`;

    // We can inject tenant name here if we had it in settings or passed in.
    const studioName = tenantSettings?.fromName || 'EMS Studio';

    const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to ${studioName}!</h2>
                <p>You have been invited to join our client portal to manage your sessions and payments.</p>
                <p>Please click the button below to set up your password and access your account:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Set Up Account</a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>${inviteLink}</p>
            </div>
        `;
    return this.sendMail(email, subject, text, html, tenantSettings);
  }

  async sendPasswordReset(email: string, resetLink: string, tenantSettings?: any) {
    const studioName = tenantSettings?.fromName || 'EMS Studio';
    const subject = `Reset Your Password - ${studioName}`;
    const text = `You requested a password reset. Please click the link below to reset your password: ${resetLink}. This link is valid for 1 hour.`;
    const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>We received a request to reset your password for your ${studioName} account. If you didn't make this request, you can safely ignore this email.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </p>
                <p style="color: #666; font-size: 14px;">This link expires in 1 hour.<br>Or copy and paste this link:<br>${resetLink}</p>
            </div>
        `;
    return this.sendMail(email, subject, text, html, tenantSettings);
  }
}
