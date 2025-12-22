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
            // Don't throw to prevent blocking the main flow (e.g. session creation)
            // or throw if critical. For notifications, usually better to log and continue.
            return null;
        }
    }
}
