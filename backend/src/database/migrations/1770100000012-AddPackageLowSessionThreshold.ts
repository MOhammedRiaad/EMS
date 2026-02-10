import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageLowSessionThreshold1770100000012 implements MigrationInterface {
  name = 'AddPackageLowSessionThreshold1770100000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add low_session_threshold column to packages table
    await queryRunner.query(`
      ALTER TABLE packages
      ADD COLUMN IF NOT EXISTS low_session_threshold INT DEFAULT 2
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE packages
      DROP COLUMN IF EXISTS low_session_threshold
    `);
  }
}
