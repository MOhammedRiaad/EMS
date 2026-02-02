import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InBodyScan } from './entities/inbody-scan.entity';
import { InBodyScansController } from './inbody-scans.controller';
import { InBodyScansService } from './inbody-scans.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([InBodyScan]), StorageModule],
  controllers: [InBodyScansController],
  providers: [InBodyScansService],
  exports: [InBodyScansService],
})
export class InBodyScansModule {}
