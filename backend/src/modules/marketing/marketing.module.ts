import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationExecution } from './entities/automation-execution.entity';
import { Session } from '../sessions/entities/session.entity';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { MailerModule } from '../mailer/mailer.module';
import { AuditModule } from '../audit/audit.module';
import { OwnerModule } from '../owner/owner.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionReminderCron } from './crons/session-reminder.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationRule, AutomationExecution, Session]),
    MailerModule,
    AuditModule,
    WhatsAppModule,
    TenantsModule,
    NotificationsModule,
    forwardRef(() => OwnerModule),
  ],
  controllers: [AutomationController],
  providers: [AutomationService, SessionReminderCron],
  exports: [TypeOrmModule, AutomationService],
})
export class MarketingModule {}
