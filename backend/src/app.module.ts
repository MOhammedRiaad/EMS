import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { StudiosModule } from './modules/studios/studios.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CoachesModule } from './modules/coaches/coaches.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({

        type: 'postgres',
        host: configService.get('POSTGRES_HOST') || 'postgres',
        port: parseInt(configService.get('POSTGRES_PORT') || '5432', 10),
        username: configService.get('POSTGRES_USER') || 'ems_user',
        password: configService.get('POSTGRES_PASSWORD') || 'pass',
        database: configService.get('POSTGRES_DB') || 'ems_studio',
        autoLoadEntities: true,
        synchronize: false, // Using init SQL scripts
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    TenantsModule,
    StudiosModule,
    RoomsModule,
    CoachesModule,
    ClientsModule,
    SessionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }
