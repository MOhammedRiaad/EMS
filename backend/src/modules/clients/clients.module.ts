import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Client } from './entities/client.entity';
import { ClientProgressPhoto } from './entities/client-progress-photo.entity';
import { ClientDocument } from './entities/client-document.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';

import { Transaction } from '../packages/entities/transaction.entity';
import { User } from '../auth/entities/user.entity';
import { WaiversModule } from '../waivers/waivers.module';
import { AuditModule } from '../audit/audit.module';
import { OwnerModule } from '../owner/owner.module';
import { StorageModule } from '../storage/storage.module';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';
import { Session } from '../sessions/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Transaction,
      ClientProgressPhoto,
      ClientDocument,
      User,
      FavoriteCoach,
      Session,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
        }
      },
    }),
    AuthModule,
    MailerModule,
    StorageModule,
    forwardRef(() => WaiversModule),
    AuditModule,
    forwardRef(() => OwnerModule),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }
