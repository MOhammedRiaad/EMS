import { Module } from '@nestjs/common';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';
import { SessionsModule } from '../sessions/sessions.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [SessionsModule, PackagesModule],
    controllers: [ClientPortalController],
    providers: [ClientPortalService],
})
export class ClientPortalModule { }
