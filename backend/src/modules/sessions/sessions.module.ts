import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

import { ClientsModule } from '../clients/clients.module';
import { MailerModule } from '../mailer/mailer.module';
import { PackagesModule } from '../packages/packages.module';
import { AuditModule } from '../audit/audit.module';

import { MarketingModule } from '../marketing/marketing.module';
import { GamificationModule } from '../gamification/gamification.module';

import { SessionParticipant } from './entities/session-participant.entity';
import { SessionParticipantsService } from './session-participants.service';
import { OwnerModule } from '../owner/owner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      SessionParticipant,
      Room,
      Studio,
      Coach,
      CoachTimeOffRequest,
      Tenant,
    ]),
    ClientsModule,
    MailerModule,
    PackagesModule,
    PackagesModule,
    MarketingModule,
    GamificationModule,
    AuditModule,
    forwardRef(() => OwnerModule),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionParticipantsService],
  exports: [SessionsService, SessionParticipantsService],
})
export class SessionsModule {}
