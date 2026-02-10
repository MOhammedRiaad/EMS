import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppTenantConfig1770100000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add whatsappConfig to settings JSONB for all tenants if it doesn't exist
    await queryRunner.query(`
      UPDATE tenants 
      SET settings = settings || '{"whatsappConfig": {"provider": "meta", "enabled": false, "config": {}}}'
      WHERE settings->'whatsappConfig' IS NULL;
    `);

    // Ensure the core.whatsapp feature flag exists in the global feature_flags table
    // We check if it exists first to avoid duplicates
    await queryRunner.query(`
      INSERT INTO feature_flags (key, name, description, category, default_enabled)
      SELECT 'core.whatsapp', 'WhatsApp Business Integration', 'WhatsApp Business Integration', 'marketing', false
      WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE key = 'core.whatsapp');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove whatsappConfig from settings
    await queryRunner.query(`
      UPDATE tenants 
      SET settings = settings - 'whatsappConfig';
    `);

    // Remove the global feature flag
    await queryRunner.query(`
      DELETE FROM feature_flags WHERE key = 'core.whatsapp';
    `);
  }
}
