import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { User } from '../auth/entities/user.entity';
import { Session } from '../sessions/entities/session.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Session]),
        SessionsModule
    ],
    controllers: [CalendarController],
    providers: [CalendarService],
    exports: [CalendarService]
})
export class CalendarModule { }
