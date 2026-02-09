import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Session } from '../../sessions/entities/session.entity';
import { AutomationService } from '../automation.service';
import { AutomationTriggerType } from '../entities/automation-rule.entity';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { TenantsService } from '../../tenants/tenants.service';

@Injectable()
export class SessionReminderCron {
  private readonly logger = new Logger(SessionReminderCron.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly automationService: AutomationService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSessionReminders() {
    this.logger.log('Checking for scheduled session reminders...');

    const tenants = await this.tenantsService.findAll();
    const currentHour = new Date().getHours();

    for (const tenant of tenants) {
      const config = tenant.settings?.whatsappConfig;
      // Check if WhatsApp and reminders are enabled
      if (!config || !config.enabled || !config.reminderEnabled) {
        continue;
      }

      // Default to 10:00 AM if not set
      const reminderTime = config.reminderTime || '10:00';
      const [hourStr] = reminderTime.split(':');
      const scheduledHour = parseInt(hourStr, 10);

      if (currentHour === scheduledHour) {
        this.logger.log(
          `Processing reminders for tenant ${tenant.name} (${tenant.id}) at scheduled hour ${scheduledHour}`,
        );
        await this.processRemindersForTenant(tenant.id);
      }
    }
  }

  private async processRemindersForTenant(tenantId: string) {
    // Find sessions for TOMORROW
    const tomorrow = addDays(new Date(), 1);
    const startWindow = startOfDay(tomorrow);
    const endWindow = endOfDay(tomorrow);

    const upcomingSessions = await this.sessionRepository.find({
      where: {
        tenantId,
        startTime: Between(startWindow, endWindow),
        status: 'scheduled' as any,
      },
      relations: ['participants', 'participants.client'],
    });

    if (upcomingSessions.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${upcomingSessions.length} sessions for reminder trigger (Tenant: ${tenantId})`,
    );

    for (const session of upcomingSessions) {
      if (!session.participants) continue;

      for (const participant of session.participants) {
        if (!participant.client) continue;

        await this.automationService.triggerEvent(
          AutomationTriggerType.SESSION_REMINDER,
          {
            tenantId: session.tenantId,
            clientId: participant.clientId,
            client: participant.client,
            session: {
              id: session.id,
              startTime: session.startTime,
              type: session.type,
            },
            // For custom template injection
            userName: participant.client.firstName || 'Client',
            sessionTime: session.startTime.toLocaleString(),
          },
        );
      }
    }
  }
}
