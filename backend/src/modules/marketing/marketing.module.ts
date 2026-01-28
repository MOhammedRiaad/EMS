import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationRule } from './entities/automation-rule.entity';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
    imports: [TypeOrmModule.forFeature([AutomationRule])],
    controllers: [AutomationController],
    providers: [AutomationService],
    exports: [TypeOrmModule, AutomationService]
})
export class MarketingModule { }
