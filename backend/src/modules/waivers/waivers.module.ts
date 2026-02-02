import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaiversController } from './waivers.controller';
import { WaiversService } from './waivers.service';
import { Waiver } from './entities/waiver.entity';
import { ClientWaiver } from './entities/client-waiver.entity';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waiver, ClientWaiver]),
    forwardRef(() => ClientsModule),
  ],
  controllers: [WaiversController],
  providers: [WaiversService],
  exports: [WaiversService],
})
export class WaiversModule {}
