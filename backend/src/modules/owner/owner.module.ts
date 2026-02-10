import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entities
import {
  FeatureFlag,
  FeatureAssignment,
  Plan,
  UsageMetric,
  OwnerAuditLog,
  PlanUpgradeRequest,
} from './entities';
import { BroadcastMessage } from './entities/broadcast-message.entity';
import { SystemSettings } from './entities/system-settings.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../auth/entities/user.entity';
import { Permission } from '../auth/entities/permission.entity';
import { Role } from '../auth/entities/role.entity';
import { UserRoleAssignment } from '../auth/entities/user-role.entity';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Session } from '../sessions/entities/session.entity';
import { Transaction } from '../packages/entities/transaction.entity';
import { TermsAcceptance } from '../terms/entities/terms-acceptance.entity';

// Services
import {
  OwnerService,
  FeatureFlagService,
  PlanService,
  UsageTrackingService,
  UpgradeRequestService,
  OwnerAuditService,
  BroadcastService,
  SystemConfigService,
  OwnerDataExportService,
} from './services';
import { OwnerAnalyticsService } from './services/owner-analytics.service';
import { AlertsService } from './services/alerts.service';
import { PermissionService } from '../auth/services/permission.service';
import { RoleService } from '../auth/services/role.service';

// Guards
import { PermissionGuard, PlanLimitGuard } from './guards';

// Controllers
import { OwnerController } from './controllers/owner.controller';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { PlanController } from './controllers/plan.controller';
import {
  UpgradeRequestController,
  TenantUpgradeRequestController,
} from './controllers/upgrade-request.controller';
import {
  UsageController,
  TenantUsageController,
} from './controllers/usage.controller';
import { OwnerAnalyticsController } from './controllers/analytics.controller';
import { AlertsController } from './controllers/alerts.controller';
import { RoleController } from './controllers/role.controller';
import { OwnerUsersController } from './controllers/owner-users.controller';
import { OwnerSeedController } from './controllers/owner-seed.controller';

import { MarketingModule } from '../marketing/marketing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Owner entities
      FeatureFlag,
      FeatureAssignment,
      Plan,
      UsageMetric,
      OwnerAuditLog,
      PlanUpgradeRequest,
      BroadcastMessage,
      SystemSettings,
      // Shared entities
      Tenant,
      User,
      Permission,
      Role,
      UserRoleAssignment,
      Client,
      Coach,
      Session,
      Transaction,
      TermsAcceptance,
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
    }),
    forwardRef(() => MarketingModule),
  ],
  controllers: [
    OwnerController,
    FeatureFlagController,
    PlanController,
    UpgradeRequestController,
    TenantUpgradeRequestController,
    UsageController,
    TenantUsageController,
    OwnerAnalyticsController,
    AlertsController,
    RoleController,
    OwnerUsersController,
    OwnerSeedController,
  ],
  providers: [
    // Services
    OwnerService,
    FeatureFlagService,
    PlanService,
    UsageTrackingService,
    UpgradeRequestService,
    OwnerAuditService,
    OwnerAnalyticsService,
    AlertsService,
    BroadcastService,
    SystemConfigService,
    OwnerDataExportService,
    PermissionService,
    RoleService,
    // Guards
    PermissionGuard,
    PlanLimitGuard,
  ],
  exports: [
    OwnerService,
    FeatureFlagService,
    PlanService,
    UsageTrackingService,
    UpgradeRequestService,
    OwnerAuditService,
    OwnerAnalyticsService,
    AlertsService,
    BroadcastService,
    SystemConfigService,
    OwnerDataExportService,
    PermissionService,
    RoleService,
    PermissionGuard,
    PlanLimitGuard,
  ],
})
export class OwnerModule { }
