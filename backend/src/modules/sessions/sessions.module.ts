import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

import { ClientsModule } from '../clients/clients.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, Room, Studio, Coach]),
        ClientsModule,
        MailerModule,
    ],
    controllers: [SessionsController],
    providers: [SessionsService],
    exports: [SessionsService],
})
export class SessionsModule { }
