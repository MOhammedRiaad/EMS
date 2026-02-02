import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachPortalController } from './coach-portal.controller';
import { CoachPortalService } from './coach-portal.service';
import { Session } from '../sessions/entities/session.entity';
import { Client } from '../clients/entities/client.entity';
import { InBodyScan } from '../inbody-scans/entities/inbody-scan.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      Client,
      InBodyScan,
      Coach,
      CoachTimeOffRequest,
    ]),
  ],
  controllers: [CoachPortalController],
  providers: [CoachPortalService],
})
export class CoachPortalModule {}
