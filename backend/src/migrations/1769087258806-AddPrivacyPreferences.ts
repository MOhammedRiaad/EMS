import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrivacyPreferences1769087258806 implements MigrationInterface {
    name = 'AddPrivacyPreferences1769087258806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ADD "privacy_preferences" jsonb NOT NULL DEFAULT '{"leaderboard_visible": true, "activity_feed_visible": true}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "privacy_preferences"`);
    }

}
