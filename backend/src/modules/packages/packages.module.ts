import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package, ClientPackage, Transaction } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature([Package, ClientPackage, Transaction])],
    controllers: [PackagesController],
    providers: [PackagesService],
    exports: [PackagesService],
})
export class PackagesModule { }
