import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Studio } from './entities/studio.entity';
import { StudiosController } from './studios.controller';
import { StudiosService } from './studios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Studio])],
  controllers: [StudiosController],
  providers: [StudiosService],
  exports: [StudiosService],
})
export class StudiosModule {}
