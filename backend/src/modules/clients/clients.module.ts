import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';

import { Transaction } from '../packages/entities/transaction.entity';
import { WaiversModule } from '../waivers/waivers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Client, Transaction]),
        AuthModule,
        MailerModule,
        forwardRef(() => WaiversModule)
    ],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule { }
