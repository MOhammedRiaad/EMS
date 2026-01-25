import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqResponse } from './entities/parq.entity';
import { ParqController } from './parq.controller';
import { ParqService } from './parq.service';

@Module({
    imports: [TypeOrmModule.forFeature([ParqResponse])],
    controllers: [ParqController],
    providers: [ParqService],
    exports: [ParqService],
})
export class ParqModule { }
