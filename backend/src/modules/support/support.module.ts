import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportTicket, TicketMessage } from './entities/index';

@Module({
    imports: [TypeOrmModule.forFeature([SupportTicket, TicketMessage])],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule { }
