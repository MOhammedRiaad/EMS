import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecurityFields1769000000000 implements MigrationInterface {
    name = 'AddSecurityFields1769000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_two_factor_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "two_factor_secret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_two_factor_enabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lockout_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`);
    }
}
