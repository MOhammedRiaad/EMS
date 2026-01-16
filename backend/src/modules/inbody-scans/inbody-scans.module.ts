import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InBodyScan } from './entities/inbody-scan.entity';
import { InBodyScansController } from './inbody-scans.controller';
import { InBodyScansService } from './inbody-scans.service';

@Module({
    imports: [TypeOrmModule.forFeature([InBodyScan])],
    controllers: [InBodyScansController],
    providers: [InBodyScansService],
    exports: [InBodyScansService],
})
export class InBodyScansModule { }
