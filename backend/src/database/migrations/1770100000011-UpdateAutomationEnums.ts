import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAutomationEnums1770100000011 implements MigrationInterface {
    name = 'UpdateAutomationEnums1770100000011';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL Add values to existing enums
        // Note: ADD VALUE cannot be executed inside a transaction block in some versions,
        // but TypeORM queryRunner.query handles standard execution.
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_triggertype_enum" ADD VALUE 'session_reminder'`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum" ADD VALUE 'send_whatsapp'`);
        await queryRunner.query(`ALTER TYPE "public"."automation_rules_actiontype_enum" ADD VALUE 'send_notification'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from an enum type.
        // To revert, one would need to drop and recreate the type, which is data-destructive
        // if the values are in use.
    }
}
