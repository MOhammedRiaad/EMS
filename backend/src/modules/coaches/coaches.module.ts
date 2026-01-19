import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coach } from './entities/coach.entity';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Coach]),
        AuthModule
    ],
    controllers: [CoachesController],
    providers: [CoachesService],
    exports: [CoachesService],
})
export class CoachesModule { }
