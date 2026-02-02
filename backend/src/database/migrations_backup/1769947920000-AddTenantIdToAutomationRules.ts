import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToAutomationRules1769947920000 implements MigrationInterface {
  name = 'AddTenantIdToAutomationRules1769947920000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update Automation Rules
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ADD "tenant_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ADD "actions" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "actionType" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "actionPayload" DROP NOT NULL`,
    );

    // Create Automation Executions
    await queryRunner.query(
      `CREATE TYPE "public"."automation_executions_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ruleId" uuid NOT NULL, "tenantId" character varying NOT NULL, "entityId" character varying NOT NULL, "currentStepIndex" integer NOT NULL DEFAULT '0', "nextRunAt" TIMESTAMP NOT NULL, "status" "public"."automation_executions_status_enum" NOT NULL DEFAULT 'pending', "context" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc450e9c9835c88bb3d5abec4c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_executions" ADD CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Automation Executions
    await queryRunner.query(
      `ALTER TABLE "automation_executions" DROP CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b"`,
    );
    await queryRunner.query(`DROP TABLE "automation_executions"`);
    await queryRunner.query(
      `DROP TYPE "public"."automation_executions_status_enum"`,
    );

    // Revert Automation Rules
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "actionPayload" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ALTER COLUMN "actionType" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" DROP COLUMN "actions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" DROP COLUMN "tenant_id"`,
    );
  }
}
