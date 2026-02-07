import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientProgressPhoto } from './entities/client-progress-photo.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';

import { Transaction } from '../packages/entities/transaction.entity';
import { User } from '../auth/entities/user.entity';
import { WaiversModule } from '../waivers/waivers.module';
import { AuditModule } from '../audit/audit.module';
import { OwnerModule } from '../owner/owner.module';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';
import { Session } from '../sessions/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Transaction, ClientProgressPhoto, User, FavoriteCoach, Session]),
    AuthModule,
    MailerModule,
    forwardRef(() => WaiversModule),
    AuditModule,
    forwardRef(() => OwnerModule),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
