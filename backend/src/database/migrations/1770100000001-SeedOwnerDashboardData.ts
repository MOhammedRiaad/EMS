import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedOwnerDashboardData1770100000001 implements MigrationInterface {
  name = 'SeedOwnerDashboardData1770100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. SEED PERMISSIONS (~60 permissions)
    // ============================================================
    const permissionData = [
      // Owner Permissions
      {
        key: 'owner.dashboard.view',
        name: 'View Owner Dashboard',
        category: 'owner',
      },
      { key: 'owner.tenant.list', name: 'List All Tenants', category: 'owner' },
      {
        key: 'owner.tenant.view',
        name: 'View Tenant Details',
        category: 'owner',
      },
      {
        key: 'owner.tenant.suspend',
        name: 'Suspend/Reactivate Tenant',
        category: 'owner',
      },
      {
        key: 'owner.tenant.update.plan',
        name: 'Update Tenant Plan',
        category: 'owner',
      },
      {
        key: 'owner.tenant.impersonate',
        name: 'Impersonate Tenant',
        category: 'owner',
      },
      {
        key: 'owner.tenant.reset.demo',
        name: 'Reset Demo Data',
        category: 'owner',
      },
      {
        key: 'owner.feature.toggle',
        name: 'Toggle Feature Flags',
        category: 'owner',
      },
      {
        key: 'owner.feature.view',
        name: 'View Feature Flags',
        category: 'owner',
      },
      { key: 'owner.plan.manage', name: 'Manage Plans', category: 'owner' },
      { key: 'owner.usage.view', name: 'View Global Usage', category: 'owner' },
      {
        key: 'owner.upgrade.approve',
        name: 'Approve Upgrade Requests',
        category: 'owner',
      },
      {
        key: 'owner.broadcast.send',
        name: 'Send Broadcast Messages',
        category: 'owner',
      },
      { key: 'owner.audit.view', name: 'View Audit Logs', category: 'owner' },
      {
        key: 'owner.health.view',
        name: 'View System Health',
        category: 'owner',
      },
      {
        key: 'owner.role.manage',
        name: 'Manage Roles & Permissions',
        category: 'owner',
      },

      // Tenant Permissions (for tenant owners/admins)
      {
        key: 'tenant.settings.read',
        name: 'Read Tenant Settings',
        category: 'tenant',
      },
      {
        key: 'tenant.settings.update',
        name: 'Update Tenant Settings',
        category: 'tenant',
      },
      {
        key: 'tenant.users.manage',
        name: 'Manage Tenant Users',
        category: 'tenant',
      },
      {
        key: 'tenant.roles.manage',
        name: 'Manage Tenant Roles',
        category: 'tenant',
      },
      {
        key: 'tenant.upgrade.request',
        name: 'Request Plan Upgrade',
        category: 'tenant',
      },
      {
        key: 'tenant.usage.view',
        name: 'View Tenant Usage',
        category: 'tenant',
      },
      {
        key: 'tenant.billing.view',
        name: 'View Billing Information',
        category: 'tenant',
      },

      // Client Permissions
      { key: 'client.create', name: 'Create Client', category: 'client' },
      { key: 'client.read', name: 'Read Clients', category: 'client' },
      { key: 'client.update', name: 'Update Client', category: 'client' },
      { key: 'client.delete', name: 'Delete Client', category: 'client' },
      {
        key: 'client.finance.view',
        name: 'View Client Finance',
        category: 'client',
      },
      {
        key: 'client.finance.update',
        name: 'Update Client Finance',
        category: 'client',
      },

      // Session Permissions
      { key: 'session.create', name: 'Create Session', category: 'session' },
      { key: 'session.read', name: 'Read Sessions', category: 'session' },
      { key: 'session.update', name: 'Update Session', category: 'session' },
      { key: 'session.delete', name: 'Delete Session', category: 'session' },
      { key: 'session.cancel', name: 'Cancel Session', category: 'session' },
      {
        key: 'session.complete',
        name: 'Complete Session',
        category: 'session',
      },

      // Coach Permissions
      { key: 'coach.create', name: 'Create Coach', category: 'coach' },
      { key: 'coach.read', name: 'Read Coaches', category: 'coach' },
      { key: 'coach.update', name: 'Update Coach', category: 'coach' },
      {
        key: 'coach.delete',
        name: 'Delete/Deactivate Coach',
        category: 'coach',
      },
      {
        key: 'coach.availability.manage',
        name: 'Manage Coach Availability',
        category: 'coach',
      },
      {
        key: 'coach.availability.self.edit',
        name: 'Edit Own Availability',
        category: 'coach',
      },

      // Package Permissions
      { key: 'package.create', name: 'Create Package', category: 'package' },
      { key: 'package.read', name: 'Read Packages', category: 'package' },
      { key: 'package.update', name: 'Update Package', category: 'package' },
      { key: 'package.delete', name: 'Delete Package', category: 'package' },
      {
        key: 'package.assign',
        name: 'Assign Package to Client',
        category: 'package',
      },

      // Marketing Permissions
      {
        key: 'marketing.lead.create',
        name: 'Create Lead',
        category: 'marketing',
      },
      { key: 'marketing.lead.read', name: 'Read Leads', category: 'marketing' },
      {
        key: 'marketing.lead.update',
        name: 'Update Lead',
        category: 'marketing',
      },
      {
        key: 'marketing.lead.delete',
        name: 'Delete Lead',
        category: 'marketing',
      },
      {
        key: 'marketing.automation.manage',
        name: 'Manage Automations',
        category: 'marketing',
      },
      {
        key: 'marketing.campaign.manage',
        name: 'Manage Campaigns',
        category: 'marketing',
      },

      // Communication Permissions
      {
        key: 'communication.sms.send',
        name: 'Send SMS',
        category: 'communication',
      },
      {
        key: 'communication.email.send',
        name: 'Send Email',
        category: 'communication',
      },
      {
        key: 'communication.announcement.create',
        name: 'Create Announcement',
        category: 'communication',
      },

      // Finance Permissions
      { key: 'finance.pos.use', name: 'Use POS', category: 'finance' },
      {
        key: 'finance.invoice.manage',
        name: 'Manage Invoices',
        category: 'finance',
      },
      {
        key: 'finance.report.view',
        name: 'View Financial Reports',
        category: 'finance',
      },

      // Compliance Permissions
      {
        key: 'compliance.waiver.manage',
        name: 'Manage Waivers',
        category: 'compliance',
      },
      {
        key: 'compliance.parq.manage',
        name: 'Manage PAR-Q Forms',
        category: 'compliance',
      },
      {
        key: 'compliance.audit.view',
        name: 'View Audit Logs',
        category: 'compliance',
      },
    ];

    for (const perm of permissionData) {
      await queryRunner.query(
        `
        INSERT INTO permissions (id, key, name, description, category, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (key) DO NOTHING;
      `,
        [
          uuidv4(),
          perm.key,
          perm.name,
          `Permission to ${perm.name.toLowerCase()}`,
          perm.category,
        ],
      );
    }

    // ============================================================
    // 2. SEED ROLES
    // ============================================================
    const roleData = [
      {
        key: 'platform_owner',
        name: 'Platform Owner',
        description: 'Super admin with full access to all owner operations',
        isSystem: true,
      },
      {
        key: 'support_owner',
        name: 'Support Owner',
        description: 'Read-only owner access with support capabilities',
        isSystem: true,
      },
      {
        key: 'tenant_owner',
        name: 'Tenant Owner',
        description: 'Full access to own tenant/studio',
        isSystem: true,
      },
      {
        key: 'admin',
        name: 'Admin',
        description: 'Administrative access within a tenant',
        isSystem: true,
      },
      {
        key: 'coach',
        name: 'Coach',
        description: 'Coach-level access for managing sessions and clients',
        isSystem: true,
      },
      {
        key: 'client',
        name: 'Client',
        description: 'Client-level access for viewing and booking',
        isSystem: true,
      },
    ];

    const roleIds: Record<string, string> = {};
    for (const role of roleData) {
      const id = uuidv4();
      roleIds[role.key] = id;
      await queryRunner.query(
        `
        INSERT INTO roles (id, key, name, description, is_system_role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (key) DO NOTHING;
      `,
        [id, role.key, role.name, role.description, role.isSystem],
      );
    }

    // ============================================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ============================================================

    // Helper to get permission ID
    const getPermissionId = async (key: string): Promise<string | null> => {
      const result = await queryRunner.query(
        `SELECT id FROM permissions WHERE key = $1`,
        [key],
      );
      return result[0]?.id || null;
    };

    // Platform Owner gets ALL permissions
    const allPerms = await queryRunner.query(`SELECT id FROM permissions`);
    for (const perm of allPerms) {
      await queryRunner.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, $1 FROM roles r WHERE r.key = 'platform_owner'
        ON CONFLICT DO NOTHING;
      `,
        [perm.id],
      );
    }

    // Support Owner gets read-only + support permissions
    const supportPermissions = [
      'owner.dashboard.view',
      'owner.tenant.list',
      'owner.tenant.view',
      'owner.feature.view',
      'owner.usage.view',
      'owner.audit.view',
      'owner.health.view',
      'owner.broadcast.send',
    ];
    for (const key of supportPermissions) {
      const permId = await getPermissionId(key);
      if (permId) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, $1 FROM roles r WHERE r.key = 'support_owner'
          ON CONFLICT DO NOTHING;
        `,
          [permId],
        );
      }
    }

    // Tenant Owner gets all tenant + operations permissions
    const tenantOwnerPermissions = permissionData
      .filter((p) =>
        [
          'tenant',
          'client',
          'session',
          'coach',
          'package',
          'marketing',
          'communication',
          'finance',
          'compliance',
        ].includes(p.category),
      )
      .map((p) => p.key);
    for (const key of tenantOwnerPermissions) {
      const permId = await getPermissionId(key);
      if (permId) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, $1 FROM roles r WHERE r.key = 'tenant_owner'
          ON CONFLICT DO NOTHING;
        `,
          [permId],
        );
      }
    }

    // Admin gets most tenant permissions except billing and roles
    const adminPermissions = permissionData
      .filter(
        (p) =>
          !['owner', 'tenant.billing.view', 'tenant.roles.manage'].includes(
            p.key,
          ) &&
          [
            'tenant',
            'client',
            'session',
            'coach',
            'package',
            'marketing',
            'communication',
            'compliance',
          ].includes(p.category),
      )
      .map((p) => p.key);
    adminPermissions.push('tenant.settings.read', 'tenant.usage.view');
    for (const key of adminPermissions) {
      const permId = await getPermissionId(key);
      if (permId) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, $1 FROM roles r WHERE r.key = 'admin'
          ON CONFLICT DO NOTHING;
        `,
          [permId],
        );
      }
    }

    // Coach gets limited permissions
    const coachPermissions = [
      'client.read',
      'session.read',
      'session.create',
      'session.update',
      'session.complete',
      'coach.read',
      'coach.availability.self.edit',
      'package.read',
    ];
    for (const key of coachPermissions) {
      const permId = await getPermissionId(key);
      if (permId) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, $1 FROM roles r WHERE r.key = 'coach'
          ON CONFLICT DO NOTHING;
        `,
          [permId],
        );
      }
    }

    // Client gets minimal permissions (view only)
    const clientPermissions = ['session.read', 'package.read'];
    for (const key of clientPermissions) {
      const permId = await getPermissionId(key);
      if (permId) {
        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, $1 FROM roles r WHERE r.key = 'client'
          ON CONFLICT DO NOTHING;
        `,
          [permId],
        );
      }
    }

    // ============================================================
    // 4. SEED FEATURE FLAGS
    // ============================================================
    const featureData = [
      // Core - Fundamental platform features
      {
        key: 'core.sessions',
        name: 'Sessions & Scheduling',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.group_sessions',
        name: 'Group Sessions',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.waiting_list',
        name: 'Waiting List',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.rooms',
        name: 'Room Management',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.devices',
        name: 'EMS Device Management',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.calendar',
        name: 'Calendar Views',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.reminders',
        name: 'Session Reminders',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.analytics',
        name: 'Analytics Dashboard',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'core.multi_studio',
        name: 'Multi-Studio Support',
        category: 'core',
        defaultEnabled: false,
      },
      {
        key: 'core.packages',
        name: 'Session Packages',
        category: 'core',
        defaultEnabled: true,
      },

      // Client - Client-facing features
      {
        key: 'client.portal',
        name: 'Client Portal',
        category: 'client',
        defaultEnabled: true,
      },
      {
        key: 'client.booking',
        name: 'Self-Service Booking',
        category: 'client',
        defaultEnabled: true,
      },
      {
        key: 'client.gamification',
        name: 'Gamification System',
        category: 'client',
        defaultEnabled: false,
      },
      {
        key: 'client.achievements',
        name: 'Achievements & Badges',
        category: 'client',
        defaultEnabled: false,
        dependencies: ['client.gamification'],
      },
      {
        key: 'client.goals',
        name: 'Goal Tracking',
        category: 'client',
        defaultEnabled: false,
        dependencies: ['client.gamification'],
      },
      {
        key: 'client.challenges',
        name: 'Challenges',
        category: 'client',
        defaultEnabled: false,
        dependencies: ['client.gamification'],
      },
      {
        key: 'client.activity_feed',
        name: 'Activity Feed',
        category: 'client',
        defaultEnabled: true,
      },
      {
        key: 'client.reviews',
        name: 'Session Reviews',
        category: 'client',
        defaultEnabled: false,
      },
      {
        key: 'client.progress_tracking',
        name: 'Progress Tracking',
        category: 'client',
        defaultEnabled: true,
      },
      {
        key: 'client.inbody_scans',
        name: 'InBody Scans',
        category: 'client',
        defaultEnabled: false,
      },
      {
        key: 'client.favorite_coaches',
        name: 'Favorite Coaches',
        category: 'client',
        defaultEnabled: true,
      },

      // Coach - Coach-facing features
      {
        key: 'coach.portal',
        name: 'Coach Portal',
        category: 'coach',
        defaultEnabled: true,
      },
      {
        key: 'coach.availability',
        name: 'Availability Management',
        category: 'coach',
        defaultEnabled: true,
      },
      {
        key: 'coach.self_edit_availability',
        name: 'Coach Self-Edit Availability',
        category: 'coach',
        defaultEnabled: false,
      },
      {
        key: 'coach.analytics',
        name: 'Coach Performance Analytics',
        category: 'coach',
        defaultEnabled: false,
      },
      {
        key: 'coach.client_notes',
        name: 'Client Notes',
        category: 'coach',
        defaultEnabled: true,
      },

      // Finance - Financial and payment features
      {
        key: 'finance.pos',
        name: 'Point of Sale',
        category: 'finance',
        defaultEnabled: false,
      },
      {
        key: 'finance.retail',
        name: 'Retail Sales',
        category: 'finance',
        defaultEnabled: false,
      },
      {
        key: 'finance.inventory',
        name: 'Inventory Management',
        category: 'finance',
        defaultEnabled: false,
        dependencies: ['finance.retail'],
      },
      {
        key: 'finance.client_wallet',
        name: 'Client Wallet/Balance',
        category: 'finance',
        defaultEnabled: true,
      },
      {
        key: 'finance.reports',
        name: 'Financial Reports',
        category: 'finance',
        defaultEnabled: true,
      },
      {
        key: 'finance.invoicing',
        name: 'Invoicing',
        category: 'finance',
        defaultEnabled: false,
      },
      {
        key: 'finance.transactions',
        name: 'Transaction History',
        category: 'finance',
        defaultEnabled: true,
      },

      // Marketing - Marketing and CRM features
      {
        key: 'marketing.leads_crm',
        name: 'Leads CRM',
        category: 'marketing',
        defaultEnabled: true,
      },
      {
        key: 'marketing.lead_scoring',
        name: 'Lead Scoring',
        category: 'marketing',
        defaultEnabled: false,
        dependencies: ['marketing.leads_crm'],
      },
      {
        key: 'marketing.automation',
        name: 'Automation Engine',
        category: 'marketing',
        defaultEnabled: false,
      },
      {
        key: 'marketing.email_automation',
        name: 'Email Automations',
        category: 'marketing',
        defaultEnabled: false,
        dependencies: ['marketing.automation'],
      },
      {
        key: 'marketing.sms_automation',
        name: 'SMS Automations',
        category: 'marketing',
        defaultEnabled: false,
        dependencies: ['marketing.automation'],
      },
      {
        key: 'marketing.campaigns',
        name: 'Campaign Templates',
        category: 'marketing',
        defaultEnabled: false,
        dependencies: ['marketing.automation'],
      },
      {
        key: 'marketing.referrals',
        name: 'Referral Program',
        category: 'marketing',
        defaultEnabled: false,
      },

      // Communication - Messaging and notification features
      {
        key: 'communication.sms',
        name: 'SMS Messaging',
        category: 'communication',
        defaultEnabled: true,
      },
      {
        key: 'communication.email',
        name: 'Email Messaging',
        category: 'communication',
        defaultEnabled: true,
      },
      {
        key: 'communication.notifications',
        name: 'Push Notifications',
        category: 'communication',
        defaultEnabled: true,
      },
      {
        key: 'communication.announcements',
        name: 'Announcements',
        category: 'communication',
        defaultEnabled: true,
      },
      {
        key: 'communication.in_app_chat',
        name: 'In-App Chat',
        category: 'communication',
        defaultEnabled: false,
        isExperimental: true,
      },

      // Compliance - Legal and compliance features
      {
        key: 'compliance.waivers',
        name: 'Digital Waivers',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        key: 'compliance.parq',
        name: 'PAR-Q Health Forms',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        key: 'compliance.terms',
        name: 'Terms of Service',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        key: 'compliance.audit_logs',
        name: 'Audit Logs',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        key: 'compliance.gdpr',
        name: 'GDPR Compliance',
        category: 'compliance',
        defaultEnabled: true,
      },
      {
        key: 'compliance.data_export',
        name: 'Data Export',
        category: 'compliance',
        defaultEnabled: false,
      },

      // Dashboard - Dashboard and reporting features
      {
        key: 'dashboard.admin',
        name: 'Admin Dashboard',
        category: 'dashboard',
        defaultEnabled: true,
      },
      {
        key: 'dashboard.custom_widgets',
        name: 'Custom Dashboard Widgets',
        category: 'dashboard',
        defaultEnabled: false,
      },
      {
        key: 'dashboard.export_reports',
        name: 'Export Reports',
        category: 'dashboard',
        defaultEnabled: true,
      },
    ];

    for (const feature of featureData) {
      await queryRunner.query(
        `
        INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (key) DO NOTHING;
      `,
        [
          uuidv4(),
          feature.key,
          feature.name,
          `Feature: ${feature.name}`,
          feature.category,
          feature.defaultEnabled,
          JSON.stringify(feature.dependencies || []),
          feature.isExperimental || false,
        ],
      );
    }

    // ============================================================
    // 5. SEED PLANS
    // ============================================================
    const planData = [
      {
        key: 'trial',
        name: 'Trial',
        description: '30-day free trial with basic features',
        limits: {
          maxClients: 20,
          maxCoaches: 2,
          maxSessionsPerMonth: 50,
          smsAllowance: 50,
          emailAllowance: 500,
          storageGB: 5,
        },
        features: [
          // Core essentials
          'core.sessions',
          'core.waiting_list',
          'core.rooms',
          'core.calendar',
          'core.reminders',
          'core.packages',
          // Basic client features
          'client.portal',
          'client.booking',
          'client.activity_feed',
          'client.favorite_coaches',
          // Basic coach features
          'coach.portal',
          'coach.availability',
          'coach.client_notes',
          // Communication
          'communication.email',
          'communication.notifications',
          // Compliance
          'compliance.waivers',
          'compliance.parq',
          'compliance.terms',
          // Dashboard
          'dashboard.admin',
        ],
        price: null,
      },
      {
        key: 'starter',
        name: 'Starter',
        description: 'Perfect for small studios just getting started',
        limits: {
          maxClients: 100,
          maxCoaches: 5,
          maxSessionsPerMonth: 300,
          smsAllowance: 200,
          emailAllowance: 2000,
          storageGB: 20,
        },
        features: [
          // Core
          'core.sessions',
          'core.group_sessions',
          'core.waiting_list',
          'core.rooms',
          'core.devices',
          'core.calendar',
          'core.reminders',
          'core.analytics',
          'core.packages',
          // Client
          'client.portal',
          'client.booking',
          'client.activity_feed',
          'client.progress_tracking',
          'client.favorite_coaches',
          // Coach
          'coach.portal',
          'coach.availability',
          'coach.client_notes',
          // Finance
          'finance.client_wallet',
          'finance.reports',
          'finance.transactions',
          // Marketing
          'marketing.leads_crm',
          // Communication
          'communication.sms',
          'communication.email',
          'communication.notifications',
          'communication.announcements',
          // Compliance
          'compliance.waivers',
          'compliance.parq',
          'compliance.terms',
          'compliance.audit_logs',
          'compliance.gdpr',
          // Dashboard
          'dashboard.admin',
          'dashboard.export_reports',
        ],
        price: 49.0,
      },
      {
        key: 'pro',
        name: 'Pro',
        description: 'Advanced features for growing studios',
        limits: {
          maxClients: 500,
          maxCoaches: 20,
          maxSessionsPerMonth: 2000,
          smsAllowance: 1000,
          emailAllowance: 10000,
          storageGB: 100,
        },
        features: [
          // Core - all features
          'core.sessions',
          'core.group_sessions',
          'core.waiting_list',
          'core.rooms',
          'core.devices',
          'core.calendar',
          'core.reminders',
          'core.analytics',
          'core.packages',
          // Client - with gamification
          'client.portal',
          'client.booking',
          'client.gamification',
          'client.achievements',
          'client.goals',
          'client.challenges',
          'client.activity_feed',
          'client.reviews',
          'client.progress_tracking',
          'client.inbody_scans',
          'client.favorite_coaches',
          // Coach - with analytics
          'coach.portal',
          'coach.availability',
          'coach.self_edit_availability',
          'coach.analytics',
          'coach.client_notes',
          // Finance - with POS and retail
          'finance.pos',
          'finance.retail',
          'finance.inventory',
          'finance.client_wallet',
          'finance.reports',
          'finance.invoicing',
          'finance.transactions',
          // Marketing - with automation
          'marketing.leads_crm',
          'marketing.lead_scoring',
          'marketing.automation',
          'marketing.email_automation',
          'marketing.sms_automation',
          'marketing.campaigns',
          'marketing.referrals',
          // Communication - all
          'communication.sms',
          'communication.email',
          'communication.notifications',
          'communication.announcements',
          // Compliance - all
          'compliance.waivers',
          'compliance.parq',
          'compliance.terms',
          'compliance.audit_logs',
          'compliance.gdpr',
          'compliance.data_export',
          // Dashboard - all
          'dashboard.admin',
          'dashboard.custom_widgets',
          'dashboard.export_reports',
        ],
        price: 149.0,
      },
      {
        key: 'enterprise',
        name: 'Enterprise',
        description: 'Unlimited access with priority support and all features',
        limits: {
          maxClients: -1,
          maxCoaches: -1,
          maxSessionsPerMonth: -1,
          smsAllowance: -1,
          emailAllowance: -1,
          storageGB: -1,
        },
        features: [
          // Core - all including multi-studio
          'core.sessions',
          'core.group_sessions',
          'core.waiting_list',
          'core.rooms',
          'core.devices',
          'core.calendar',
          'core.reminders',
          'core.analytics',
          'core.multi_studio',
          'core.packages',
          // Client - all features
          'client.portal',
          'client.booking',
          'client.gamification',
          'client.achievements',
          'client.goals',
          'client.challenges',
          'client.activity_feed',
          'client.reviews',
          'client.progress_tracking',
          'client.inbody_scans',
          'client.favorite_coaches',
          // Coach - all features
          'coach.portal',
          'coach.availability',
          'coach.self_edit_availability',
          'coach.analytics',
          'coach.client_notes',
          // Finance - all features
          'finance.pos',
          'finance.retail',
          'finance.inventory',
          'finance.client_wallet',
          'finance.reports',
          'finance.invoicing',
          'finance.transactions',
          // Marketing - all features
          'marketing.leads_crm',
          'marketing.lead_scoring',
          'marketing.automation',
          'marketing.email_automation',
          'marketing.sms_automation',
          'marketing.campaigns',
          'marketing.referrals',
          // Communication - all including experimental
          'communication.sms',
          'communication.email',
          'communication.notifications',
          'communication.announcements',
          'communication.in_app_chat',
          // Compliance - all features
          'compliance.waivers',
          'compliance.parq',
          'compliance.terms',
          'compliance.audit_logs',
          'compliance.gdpr',
          'compliance.data_export',
          // Dashboard - all features
          'dashboard.admin',
          'dashboard.custom_widgets',
          'dashboard.export_reports',
        ],
        price: null, // Contact us
      },
    ];

    for (const plan of planData) {
      await queryRunner.query(
        `
        INSERT INTO plans (id, key, name, description, limits, features, is_active, price)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7)
        ON CONFLICT (key) DO NOTHING;
      `,
        [
          uuidv4(),
          plan.key,
          plan.name,
          plan.description,
          JSON.stringify(plan.limits),
          JSON.stringify(plan.features),
          plan.price,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clear seeded data
    await queryRunner.query(`DELETE FROM role_permissions;`);
    await queryRunner.query(`DELETE FROM user_roles;`);
    await queryRunner.query(`DELETE FROM roles WHERE is_system_role = true;`);
    await queryRunner.query(`DELETE FROM permissions;`);
    await queryRunner.query(`DELETE FROM feature_flags;`);
    await queryRunner.query(`DELETE FROM plans;`);
  }
}
