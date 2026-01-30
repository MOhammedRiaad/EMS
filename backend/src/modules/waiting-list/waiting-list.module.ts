import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingListController } from './waiting-list.controller';
import { WaitingListService } from './waiting-list.service';
import { WaitingListEntry } from './entities/waiting-list.entity';
import { MailerModule } from '../mailer/mailer.module';
import { StudiosModule } from '../studios/studios.module';
import { ClientsModule } from '../clients/clients.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WaitingListEntry]),
        TypeOrmModule.forFeature([WaitingListEntry]),
        MailerModule,
        StudiosModule,
        ClientsModule,
        AuditModule,
    ],
    controllers: [WaitingListController],
    providers: [WaitingListService],
    exports: [WaitingListService],
})
export class WaitingListModule { }
