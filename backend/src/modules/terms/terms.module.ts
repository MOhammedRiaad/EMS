import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsOfService } from './entities/terms.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';

@Module({
    imports: [TypeOrmModule.forFeature([TermsOfService, TermsAcceptance])],
    controllers: [TermsController],
    providers: [TermsService],
    exports: [TermsService],
})
export class TermsModule { }
