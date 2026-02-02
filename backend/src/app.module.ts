import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
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
import { ClientPortalModule } from './modules/client-portal/client-portal.module';
import { CoachPortalModule } from './modules/coach-portal/coach-portal.module';
import { RetailModule } from './modules/retail/retail.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderModule } from './modules/reminders/reminder.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { WaiversModule } from './modules/waivers/waivers.module';
import { TermsModule } from './modules/terms/terms.module';
import { ParqModule } from './modules/parq/parq.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                  },
                },
          },
        };
      },
    }),
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
        url: configService.get('DATABASE_URL'),
        host: configService.get('POSTGRES_HOST'),
        port: parseInt(configService.get('POSTGRES_PORT') || '5432', 10),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true, // Auto-run migrations on startup
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
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
    ClientPortalModule,
    CoachPortalModule,
    ScheduleModule.forRoot(),
    ReminderModule,
    AnalyticsModule,
    GamificationModule,
    WaiversModule,
    ParqModule,
    TermsModule,
    RetailModule,
    CalendarModule,
    LeadsModule,
    MarketingModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
