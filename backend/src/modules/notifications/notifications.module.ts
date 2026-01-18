import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';
import { WaitingListEntry } from '../waiting-list/entities/waiting-list.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, ClientPackage, WaitingListEntry]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
