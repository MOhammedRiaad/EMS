import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';
import { WaitingListEntry } from '../waiting-list/entities/waiting-list.entity';
import { Notification } from './entities/notification.entity';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';

import { CoachesModule } from '../coaches/coaches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      ClientPackage,
      WaitingListEntry,
      Notification,
      Announcement,
      AnnouncementRead,
    ]),
    CoachesModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
