import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { User } from '../auth/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { OwnerModule } from '../owner/owner.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Client, Coach]),
        OwnerModule, // For UsageTrackingService
    ],
    controllers: [ImportController],
    providers: [ImportService],
    exports: [ImportService],
})
export class ImportModule { }
