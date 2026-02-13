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
import { CoachTimeOffRequest } from '../src/modules/coaches/entities/coach-time-off.entity';
import { Client } from '../src/modules/clients/entities/client.entity';
import { Session } from '../src/modules/sessions/entities/session.entity';
import { EmsDevice } from '../src/modules/devices/entities/ems-device.entity';
import { ClientSessionReview } from '../src/modules/reviews/entities/review.entity';
import { InBodyScan } from '../src/modules/inbody-scans/entities/inbody-scan.entity';
import { WaitingListEntry } from '../src/modules/waiting-list/entities/waiting-list.entity';
import { Package } from '../src/modules/packages/entities/package.entity';
import { ClientPackage } from '../src/modules/packages/entities/client-package.entity';
import { Transaction } from '../src/modules/packages/entities/transaction.entity';
import { Product } from '../src/modules/retail/entities/product.entity';
import { ProductStock } from '../src/modules/retail/entities/product-stock.entity';
import { Sale } from '../src/modules/retail/entities/sale.entity';
import { SaleItem } from '../src/modules/retail/entities/sale-item.entity';
import { Waiver } from '../src/modules/waivers/entities/waiver.entity';
import { ClientWaiver } from '../src/modules/waivers/entities/client-waiver.entity';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { Announcement } from '../src/modules/notifications/entities/announcement.entity';
import { AnnouncementRead } from '../src/modules/notifications/entities/announcement-read.entity';
import { SessionParticipant } from '../src/modules/sessions/entities/session-participant.entity';
import { AutomationRule } from '../src/modules/marketing/entities/automation-rule.entity';
import { AutomationExecution } from '../src/modules/marketing/entities/automation-execution.entity';
import { FeatureFlag } from '../src/modules/owner/entities/feature-flag.entity';
import { FeatureAssignment } from '../src/modules/owner/entities/feature-assignment.entity';
import { Plan } from '../src/modules/owner/entities/plan.entity';
import { UsageMetric } from '../src/modules/owner/entities/usage-metric.entity';
import { OwnerAuditLog } from '../src/modules/owner/entities/owner-audit-log.entity';
import { PlanUpgradeRequest } from '../src/modules/owner/entities/plan-upgrade-request.entity';
import { BroadcastMessage } from '../src/modules/owner/entities/broadcast-message.entity';
import { SystemSettings } from '../src/modules/owner/entities/system-settings.entity';
import { Permission } from '../src/modules/auth/entities/permission.entity';
import { PlatformRevenue } from '../src/modules/owner/entities/platform-revenue.entity';
import { Role } from '../src/modules/auth/entities/role.entity';
import { UserRoleAssignment } from '../src/modules/auth/entities/user-role.entity';
import { TermsAcceptance } from '../src/modules/terms/entities/terms-acceptance.entity';
import { TermsOfService } from '../src/modules/terms/entities/terms.entity';
import { Lead } from '../src/modules/leads/entities/lead.entity';
import { LeadActivity } from '../src/modules/leads/entities/lead-activity.entity';

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
import { RetailModule } from '../src/modules/retail/retail.module';
import { WaiversModule } from '../src/modules/waivers/waivers.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { MarketingModule } from '../src/modules/marketing/marketing.module';
import { OwnerModule } from '../src/modules/owner/owner.module';
import { LeadsModule } from '../src/modules/leads/leads.module';

import { AuditLog } from '../src/modules/audit/entities/audit-log.entity';
import { AuditModule } from '../src/modules/audit/audit.module';
import { HealthService } from '../src/common/health.service';

const ALL_ENTITIES = [
  User,
  Tenant,
  Studio,
  Room,
  Coach,
  CoachTimeOffRequest,
  Client,
  Session,
  EmsDevice,
  ClientSessionReview,
  InBodyScan,
  WaitingListEntry,
  Package,
  ClientPackage,
  Transaction,
  Product,
  ProductStock,
  Sale,
  SaleItem,
  Waiver,
  ClientWaiver,
  Notification,
  Announcement,
  AnnouncementRead,
  SessionParticipant,
  AutomationRule,
  AutomationExecution,
  AuditLog,
  FeatureFlag,
  FeatureAssignment,
  Plan,
  UsageMetric,
  OwnerAuditLog,
  PlanUpgradeRequest,
  BroadcastMessage,
  SystemSettings,
  Permission,
  Role,
  UserRoleAssignment,
  TermsAcceptance,
  TermsOfService,
  Lead,
  LeadActivity,
  PlatformRevenue,
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
        dropSchema: true, // Drop schema before each test run for clean state
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
    RetailModule,
    WaiversModule,
    NotificationsModule,
    MarketingModule,
    AuditModule,
    OwnerModule,
    LeadsModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class TestAppModule { }
