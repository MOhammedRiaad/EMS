import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { Session } from '../sessions/entities/session.entity';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session]),
        MailerModule,
    ],
    providers: [ReminderService],
    exports: [ReminderService],
})
export class ReminderModule { }
