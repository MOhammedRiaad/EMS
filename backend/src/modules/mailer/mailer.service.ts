import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailerService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST') || 'maildev',
            port: parseInt(this.configService.get('MAIL_PORT') || '1025'),
            ignoreTLS: true,
        });
    }

    async sendMail(to: string, subject: string, text: string, html?: string) {
        try {
            const info = await this.transporter.sendMail({
                from: '"EMS Studio" <no-reply@emsstudio.com>',
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

    async sendClientInvitation(email: string, inviteLink: string) {
        const subject = 'Welcome to EMS Studio Client Portal';
        const text = `Welcome to EMS Studio! You have been invited to join our client portal. Please click the link below to set up your account: ${inviteLink}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to EMS Studio!</h2>
                <p>You have been invited to join our client portal to manage your sessions and payments.</p>
                <p>Please click the button below to set up your password and access your account:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Set Up Account</a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>${inviteLink}</p>
            </div>
        `;
        return this.sendMail(email, subject, text, html);
    }
}
