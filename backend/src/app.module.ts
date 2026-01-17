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
import { DevicesModule } from './modules/devices/devices.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthController } from './common/health.controller';
import { StorageModule } from './modules/storage/storage.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { InBodyScansModule } from './modules/inbody-scans/inbody-scans.module';
import { WaitingListModule } from './modules/waiting-list/waiting-list.module';
import { PackagesModule } from './modules/packages/packages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://redis:6379',
          ttl: 60000, // 60 seconds default
        }),
      }),
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST') || 'postgres',
        port: parseInt(configService.get('POSTGRES_PORT') || '5432', 10),
        username: configService.get('POSTGRES_USER') || 'ems_user',
        password: configService.get('POSTGRES_PASSWORD') || 'ems_secret',
        database: configService.get('POSTGRES_DB') || 'ems_studio',
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true, // Auto-run migrations on startup
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
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
    DevicesModule,
    DashboardModule,
    ReviewsModule,
    StorageModule,
    MailerModule,
    InBodyScansModule,
    WaitingListModule,
    PackagesModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }
