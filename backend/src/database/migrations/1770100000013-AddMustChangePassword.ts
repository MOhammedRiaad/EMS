import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMustChangePassword1770100000013 implements MigrationInterface {
  name = 'AddMustChangePassword1770100000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add must_change_password column to users table
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS must_change_password
    `);
  }
}
