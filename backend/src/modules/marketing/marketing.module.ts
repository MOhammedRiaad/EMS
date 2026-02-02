import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationExecution } from './entities/automation-execution.entity';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { MailerModule } from '../mailer/mailer.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationRule, AutomationExecution]),
    TypeOrmModule.forFeature([AutomationRule, AutomationExecution]),
    MailerModule,
    AuditModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [TypeOrmModule, AutomationService],
})
export class MarketingModule {}
