import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coach } from './entities/coach.entity';
import { CoachTimeOffRequest } from './entities/coach-time-off.entity';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coach, CoachTimeOffRequest]),
    AuthModule,
    AuditModule,
    MailerModule,
  ],
  controllers: [CoachesController],
  providers: [CoachesService],
  exports: [CoachesService],
})
export class CoachesModule {}
