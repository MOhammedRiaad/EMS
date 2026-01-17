import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, ClientPackage]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
