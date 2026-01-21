import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from '../src/common/health.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as path from 'path';

// Entities
import { User } from '../src/modules/auth/entities/user.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { Studio } from '../src/modules/studios/entities/studio.entity';
import { Room } from '../src/modules/rooms/entities/room.entity';
import { Coach } from '../src/modules/coaches/entities/coach.entity';
import { Client } from '../src/modules/clients/entities/client.entity';
import { Session } from '../src/modules/sessions/entities/session.entity';
import { EmsDevice } from '../src/modules/devices/entities/ems-device.entity';
import { ClientSessionReview } from '../src/modules/reviews/entities/review.entity';
import { InBodyScan } from '../src/modules/inbody-scans/entities/inbody-scan.entity';
import { WaitingListEntry } from '../src/modules/waiting-list/entities/waiting-list.entity';
import { Package } from '../src/modules/packages/entities/package.entity';
import { ClientPackage } from '../src/modules/packages/entities/client-package.entity';
import { Transaction } from '../src/modules/packages/entities/transaction.entity';

// Feature Modules
import { AuthModule } from '../src/modules/auth/auth.module';
import { TenantsModule } from '../src/modules/tenants/tenants.module';
import { StudiosModule } from '../src/modules/studios/studios.module';
import { RoomsModule } from '../src/modules/rooms/rooms.module';
import { CoachesModule } from '../src/modules/coaches/coaches.module';
import { ClientsModule } from '../src/modules/clients/clients.module';
import { SessionsModule } from '../src/modules/sessions/sessions.module';
import { DevicesModule } from '../src/modules/devices/devices.module';
import { PackagesModule } from '../src/modules/packages/packages.module';
import { MailerModule } from '../src/modules/mailer/mailer.module';
import { WaitingListModule } from '../src/modules/waiting-list/waiting-list.module';
import { InBodyScansModule } from '../src/modules/inbody-scans/inbody-scans.module';
import { ReviewsModule } from '../src/modules/reviews/reviews.module';
import { DashboardModule } from '../src/modules/dashboard/dashboard.module';
import { ClientPortalModule } from '../src/modules/client-portal/client-portal.module';
import { CoachPortalModule } from '../src/modules/coach-portal/coach-portal.module';

const ALL_ENTITIES = [
    User, Tenant, Studio, Room, Coach, Client, Session,
    EmsDevice, ClientSessionReview, InBodyScan, WaitingListEntry,
    Package, ClientPackage, Transaction,
];

@Module({
    imports: [
        // Load test environment variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: path.join(__dirname, '..', '.env.test'),
        }),

        // In-memory cache for tests
        CacheModule.register({
            isGlobal: true,
            ttl: 60000,
        }),

        // PostgreSQL connection to Docker test database
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: () => ({
                type: 'postgres',
                host: process.env.POSTGRES_HOST || '127.0.0.1',
                port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
                username: process.env.POSTGRES_USER || 'ems_user',
                password: process.env.POSTGRES_PASSWORD || 'ems_secret',
                database: process.env.POSTGRES_DB || 'ems_studio_test',
                entities: ALL_ENTITIES,
                synchronize: true, // Auto-create tables for tests
                dropSchema: true,  // Drop schema before each test run for clean state
                logging: false,
            }),
            inject: [ConfigService],
        }),

        // Feature Modules
        AuthModule,
        TenantsModule,
        StudiosModule,
        RoomsModule,
        CoachesModule,
        ClientsModule,
        SessionsModule,
        DevicesModule,
        PackagesModule,
        MailerModule,
        WaitingListModule,
        InBodyScansModule,
        ReviewsModule,
        DashboardModule,
        ClientPortalModule,
        CoachPortalModule,
    ],
    controllers: [HealthController],
})
export class TestAppModule { }
