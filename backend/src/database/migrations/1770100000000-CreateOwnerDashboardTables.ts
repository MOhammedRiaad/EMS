import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOwnerDashboardTables1770100000000 implements MigrationInterface {
  name = 'CreateOwnerDashboardTables1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenant status enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tenant_status_enum AS ENUM ('trial', 'active', 'suspended', 'blocked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create upgrade request status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE upgrade_request_status_enum AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ============================================================
    // 1. PERMISSIONS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);`,
    );

    // ============================================================
    // 2. ROLES TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_system_role BOOLEAN DEFAULT false,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_roles_key ON roles(key);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);`,
    );

    // ============================================================
    // 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);`,
    );

    // ============================================================
    // 4. USER_ROLES TABLE (Many-to-Many)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT now(),
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(user_id, role_id)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);`,
    );

    // ============================================================
    // 5. FEATURE_FLAGS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        default_enabled BOOLEAN DEFAULT true,
        dependencies JSONB DEFAULT '[]',
        is_experimental BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);`,
    );

    // ============================================================
    // 6. FEATURE_ASSIGNMENTS TABLE (Tenant Overrides)
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feature_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        feature_key VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        enabled_at TIMESTAMPTZ DEFAULT now(),
        enabled_by UUID NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(tenant_id, feature_key)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_feature_assignments_tenant ON feature_assignments(tenant_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_feature_assignments_feature ON feature_assignments(feature_key);`,
    );

    // ============================================================
    // 7. PLANS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        limits JSONB NOT NULL,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        price DECIMAL(10, 2),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_plans_key ON plans(key);`,
    );

    // ============================================================
    // 8. USAGE_METRICS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS usage_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL,
        period VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant ON usage_metrics(tenant_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_metrics_date ON usage_metrics(date);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_metrics_composite ON usage_metrics(tenant_id, metric_type, date);`,
    );

    // ============================================================
    // 9. OWNER_AUDIT_LOGS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS owner_audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_owner ON owner_audit_logs(owner_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_action ON owner_audit_logs(action);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_tenant ON owner_audit_logs(target_tenant_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_created ON owner_audit_logs(created_at);`,
    );

    // ============================================================
    // 10. PLAN_UPGRADE_REQUESTS TABLE
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plan_upgrade_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        requested_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_plan VARCHAR(50) NOT NULL,
        requested_plan VARCHAR(50) NOT NULL,
        reason TEXT,
        status upgrade_request_status_enum DEFAULT 'pending',
        reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_tenant ON plan_upgrade_requests(tenant_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_plan_upgrade_requests_status ON plan_upgrade_requests(status);`,
    );

    // ============================================================
    // 11. EXTEND TENANTS TABLE
    // ============================================================
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS status tenant_status_enum DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS usage_stats JSONB,
      ADD COLUMN IF NOT EXISTS owner_notes TEXT,
      ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS block_reason TEXT;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tenants_is_blocked ON tenants(is_blocked);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove tenant columns
    await queryRunner.query(`
      ALTER TABLE tenants
      DROP COLUMN IF EXISTS status,
      DROP COLUMN IF EXISTS suspended_at,
      DROP COLUMN IF EXISTS suspended_reason,
      DROP COLUMN IF EXISTS last_activity_at,
      DROP COLUMN IF EXISTS usage_stats,
      DROP COLUMN IF EXISTS owner_notes,
      DROP COLUMN IF EXISTS is_blocked,
      DROP COLUMN IF EXISTS block_reason;
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS plan_upgrade_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS owner_audit_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS usage_metrics;`);
    await queryRunner.query(`DROP TABLE IF EXISTS plans;`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_assignments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_flags;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS upgrade_request_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS tenant_status_enum;`);
  }
}
