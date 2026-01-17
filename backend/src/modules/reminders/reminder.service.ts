import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class ReminderService {
    private readonly logger = new Logger(ReminderService.name);

    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private readonly mailerService: MailerService,
    ) { }

    /**
     * Runs every hour to check for sessions 24h ahead and send reminders
     */
    @Cron(CronExpression.EVERY_HOUR)
    async sendSessionReminders() {
        this.logger.log('Running session reminder check...');

        const now = new Date();
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        // Find sessions that are scheduled 23-25 hours from now (within 24h window)
        // that haven't had a reminder sent yet
        const upcomingSessions = await this.sessionRepository.find({
            where: {
                startTime: Between(in23Hours, in25Hours),
                status: 'scheduled' as any,
                reminderSentAt: IsNull()
            },
            relations: ['client', 'coach', 'coach.user', 'room', 'studio']
        });

        this.logger.log(`Found ${upcomingSessions.length} sessions needing reminders`);

        for (const session of upcomingSessions) {
            if (!session.client?.email) {
                this.logger.warn(`Session ${session.id} has no client email, skipping`);
                continue;
            }

            try {
                const sessionDate = new Date(session.startTime);
                const formattedDate = sessionDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const formattedTime = sessionDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const coachName = session.coach?.user
                    ? `${session.coach.user.firstName || ''} ${session.coach.user.lastName || ''}`.trim()
                    : 'Your Coach';

                const studioName = session.studio?.name || 'EMS Studio';
                const roomName = session.room?.name || '';

                const subject = `Reminder: Your EMS Session Tomorrow`;
                const text = `Hi ${session.client.firstName},\n\nThis is a friendly reminder that you have an EMS training session tomorrow.\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nLocation: ${studioName}${roomName ? ` - ${roomName}` : ''}\nCoach: ${coachName}\n\nPlease arrive 5 minutes early to prepare for your session.\n\nSee you there!\n\nBest regards,\n${studioName}`;

                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Session Reminder</h2>
                        <p>Hi ${session.client.firstName},</p>
                        <p>This is a friendly reminder that you have an EMS training session tomorrow.</p>
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
                            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${studioName}${roomName ? ` - ${roomName}` : ''}</p>
                            <p style="margin: 5px 0;"><strong>👤 Coach:</strong> ${coachName}</p>
                        </div>
                        
                        <p>Please arrive <strong>5 minutes early</strong> to prepare for your session.</p>
                        <p>See you there!</p>
                        
                        <p style="color: #666; margin-top: 30px;">
                            Best regards,<br>
                            ${studioName}
                        </p>
                    </div>
                `;

                await this.mailerService.sendMail(session.client.email, subject, text, html);

                // Mark reminder as sent
                session.reminderSentAt = new Date();
                await this.sessionRepository.save(session);

                this.logger.log(`Reminder sent for session ${session.id} to ${session.client.email}`);
            } catch (error) {
                this.logger.error(`Failed to send reminder for session ${session.id}:`, error);
            }
        }

        this.logger.log('Session reminder check completed');
    }

    /**
     * Manual trigger for testing
     */
    async triggerReminders(): Promise<{ sent: number; errors: number }> {
        let sent = 0;
        let errors = 0;

        const now = new Date();
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const upcomingSessions = await this.sessionRepository.find({
            where: {
                startTime: Between(in23Hours, in25Hours),
                status: 'scheduled' as any,
                reminderSentAt: IsNull()
            },
            relations: ['client', 'coach', 'coach.user', 'room', 'studio']
        });

        for (const session of upcomingSessions) {
            if (!session.client?.email) continue;

            try {
                // Same logic as above but simplified for manual trigger
                const sessionDate = new Date(session.startTime);
                const subject = `Reminder: Your EMS Session Tomorrow`;
                const text = `Hi ${session.client.firstName}, reminder for your session on ${sessionDate.toLocaleString()}`;

                await this.mailerService.sendMail(session.client.email, subject, text);
                session.reminderSentAt = new Date();
                await this.sessionRepository.save(session);
                sent++;
            } catch {
                errors++;
            }
        }

        return { sent, errors };
    }
}
