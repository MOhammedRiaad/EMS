import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { Session } from '../sessions/entities/session.entity';
import { MailerModule } from '../mailer/mailer.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), MailerModule, TenantsModule],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule { }
