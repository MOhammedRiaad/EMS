import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Session } from '../sessions/entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Coach, Session])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
