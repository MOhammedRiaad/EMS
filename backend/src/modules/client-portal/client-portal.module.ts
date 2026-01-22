import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';
import { SessionsModule } from '../sessions/sessions.module';
import { PackagesModule } from '../packages/packages.module';
import { WaitingListModule } from '../waiting-list/waiting-list.module';
import { ClientsModule } from '../clients/clients.module';
import { CoachesModule } from '../coaches/coaches.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FavoriteCoach]),
        SessionsModule,
        PackagesModule,
        WaitingListModule,
        ClientsModule,
        CoachesModule,
        AuthModule
    ],
    controllers: [ClientPortalController],
    providers: [ClientPortalService],
})
export class ClientPortalModule { }
