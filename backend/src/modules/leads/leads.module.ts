import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

import { ClientsModule } from '../clients/clients.module';
import { MarketingModule } from '../marketing/marketing.module';
import { OwnerModule } from '../owner/owner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadActivity]),
    ClientsModule,
    MarketingModule,
    OwnerModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [TypeOrmModule, LeadService],
})
export class LeadsModule { }
