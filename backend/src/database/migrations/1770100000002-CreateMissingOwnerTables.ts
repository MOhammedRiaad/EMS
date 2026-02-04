import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMissingOwnerTables1770100000002 implements MigrationInterface {
    name = 'CreateMissingOwnerTables1770100000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create System Settings Table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                category VARCHAR(50) NOT NULL DEFAULT 'system',
                "updatedAt" TIMESTAMPTZ DEFAULT now()
            );
        `);

        // 2. Create Broadcast Messages Table (and enums)
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE broadcast_type_enum AS ENUM ('EMAIL', 'SMS', 'IN_APP');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE broadcast_status_enum AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE broadcast_audience_enum AS ENUM ('ALL_TENANTS', 'TENANT_OWNERS', 'ALL_COACHES', 'ALL_CLIENTS', 'SPECIFIC_PLANS');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS broadcast_messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                subject VARCHAR(255),
                body TEXT NOT NULL,
                type broadcast_type_enum DEFAULT 'EMAIL',
                "targetAudience" broadcast_audience_enum DEFAULT 'ALL_TENANTS',
                "targetPlans" TEXT,
                status broadcast_status_enum DEFAULT 'DRAFT',
                "scheduledAt" TIMESTAMPTZ,
                "sentAt" TIMESTAMPTZ,
                stats JSONB,
                "createdBy" UUID NOT NULL,
                "createdAt" TIMESTAMPTZ DEFAULT now(),
                "updatedAt" TIMESTAMPTZ DEFAULT now()
            );
        `);

        // Indices
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_broadcast_messages_status ON broadcast_messages(status);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created_by ON broadcast_messages("createdBy");`);

        // 3. Seed Default System Settings
        const defaultSettings = [
            { key: 'retention.audit_logs', value: '90', category: 'retention', description: 'Days to retain audit logs' },
            { key: 'security.password_expiry', value: '0', category: 'security', description: 'Password expiry in days (0 = disabled)' },
            { key: 'maintenance.mode', value: 'false', category: 'maintenance', description: 'Global maintenance mode' },
            { key: 'system.platform_name', value: '"EMS Studio"', category: 'system', description: 'Platform display name' },
            { key: 'branding.primary_color', value: '"#3B82F6"', category: 'branding', description: 'Primary branding color' },
        ];

        for (const setting of defaultSettings) {
            await queryRunner.query(`
                INSERT INTO system_settings (key, value, category, description)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (key) DO NOTHING;
            `, [setting.key, setting.value, setting.category, setting.description]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS broadcast_messages;`);
        await queryRunner.query(`DROP TABLE IF EXISTS system_settings;`);
        await queryRunner.query(`DROP TYPE IF EXISTS broadcast_audience_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS broadcast_status_enum;`);
        await queryRunner.query(`DROP TYPE IF EXISTS broadcast_type_enum;`);
    }
}
