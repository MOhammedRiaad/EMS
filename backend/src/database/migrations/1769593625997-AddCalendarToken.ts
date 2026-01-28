import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarToken1769593625997 implements MigrationInterface {
    name = 'AddCalendarToken1769593625997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "calendar_token" character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "calendar_token"`);
    }

}
