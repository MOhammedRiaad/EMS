import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

import { ClientsModule } from '../clients/clients.module';
import { MailerModule } from '../mailer/mailer.module';
import { PackagesModule } from '../packages/packages.module';

import { GamificationModule } from '../gamification/gamification.module';

import { SessionParticipant } from './entities/session-participant.entity';
import { SessionParticipantsService } from './session-participants.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, SessionParticipant, Room, Studio, Coach, Tenant]),
        ClientsModule,
        MailerModule,
        PackagesModule,
        GamificationModule,
    ],
    controllers: [SessionsController],
    providers: [SessionsService, SessionParticipantsService],
    exports: [SessionsService, SessionParticipantsService],
})
export class SessionsModule { }
