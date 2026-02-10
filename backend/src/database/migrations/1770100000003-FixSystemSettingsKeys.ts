import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSystemSettingsKeys1770100000003 implements MigrationInterface {
  name = 'FixSystemSettingsKeys1770100000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename existing keys to match frontend expectations
    await queryRunner.query(`
            UPDATE system_settings 
            SET key = 'retention.audit_logs_days' 
            WHERE key = 'retention.audit_logs';
        `);

    await queryRunner.query(`
            UPDATE system_settings 
            SET key = 'system.maintenance_mode' 
            WHERE key = 'maintenance.mode';
        `);

    // 2. Insert missing keys if they don't exist
    await queryRunner.query(`
            INSERT INTO system_settings (key, value, category, description)
            VALUES ('retention.activity_feed_days', '30', 'retention', 'Days to retain activity feed items')
            ON CONFLICT (key) DO NOTHING;
        `);

    await queryRunner.query(`
            INSERT INTO system_settings (key, value, category, description)
            VALUES ('security.mfa_enforced', 'false', 'security', 'Enforce MFA for all users')
            ON CONFLICT (key) DO NOTHING;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert keys
    await queryRunner.query(`
            UPDATE system_settings 
            SET key = 'retention.audit_logs' 
            WHERE key = 'retention.audit_logs_days';
        `);

    await queryRunner.query(`
            UPDATE system_settings 
            SET key = 'maintenance.mode' 
            WHERE key = 'system.maintenance_mode';
        `);

    // Remove inserted keys
    await queryRunner.query(`
            DELETE FROM system_settings WHERE key = 'retention.activity_feed_days';
        `);

    await queryRunner.query(`
            DELETE FROM system_settings WHERE key = 'security.mfa_enforced';
        `);
  }
}
