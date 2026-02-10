import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

import { ClientsModule } from '../clients/clients.module';
import { MarketingModule } from '../marketing/marketing.module';
import { OwnerModule } from '../owner/owner.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadActivity]),
    ClientsModule,
    MarketingModule,
    OwnerModule,
    SessionsModule,
    PackagesModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [TypeOrmModule, LeadService],
})
export class LeadsModule {}
