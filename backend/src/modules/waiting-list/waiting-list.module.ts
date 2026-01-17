import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingListController } from './waiting-list.controller';
import { WaitingListService } from './waiting-list.service';
import { WaitingListEntry } from './entities/waiting-list.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WaitingListEntry])],
    controllers: [WaitingListController],
    providers: [WaitingListService],
    exports: [WaitingListService],
})
export class WaitingListModule { }
