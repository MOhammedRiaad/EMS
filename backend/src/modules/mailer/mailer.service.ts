import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailerService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST') || this.configService.get('MAIL_HOST') || 'maildev',
            port: parseInt(this.configService.get('SMTP_PORT') || this.configService.get('MAIL_PORT') || '1025'),
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

    async sendPasswordReset(email: string, resetLink: string) {
        const subject = 'Reset Your Password - EMS Studio';
        const text = `You requested a password reset. Please click the link below to reset your password: ${resetLink}. This link is valid for 1 hour.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </p>
                <p style="color: #666; font-size: 14px;">This link expires in 1 hour.<br>Or copy and paste this link:<br>${resetLink}</p>
            </div>
        `;
        return this.sendMail(email, subject, text, html);
    }
}
