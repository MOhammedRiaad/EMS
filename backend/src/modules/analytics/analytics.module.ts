import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Client } from '../clients/entities/client.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';
import { Package } from '../packages/entities/package.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Room } from '../rooms/entities/room.entity';
import { EmsDevice } from '../devices/entities/ems-device.entity';
import { WaitingListEntry } from '../waiting-list/entities/waiting-list.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { Lead } from '../leads/entities/lead.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Client,
            Session,
            ClientPackage,
            Package,
            Coach,
            Room,
            EmsDevice,
            WaitingListEntry,
            ClientSessionReview,
            Lead,
        ]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
