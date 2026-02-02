import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncMissingTables1769681843728 implements MigrationInterface {
  name = 'SyncMissingTables1769681843728';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "tenantId" character varying NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'info', "data" jsonb, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."announcements_targettype_enum" AS ENUM('all', 'clients', 'coaches', 'specific_users')`,
    );
    await queryRunner.query(
      `CREATE TABLE "announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "targetType" "public"."announcements_targettype_enum" NOT NULL DEFAULT 'all', "targetUserIds" jsonb, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "announcement_reads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "announcementId" uuid NOT NULL, "userId" uuid NOT NULL, "readAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d82327e564612085a67f912bfae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_executions_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ruleId" uuid NOT NULL, "tenantId" character varying NOT NULL, "entityId" character varying NOT NULL, "currentStepIndex" integer NOT NULL DEFAULT '0', "nextRunAt" TIMESTAMP NOT NULL, "status" "public"."automation_executions_status_enum" NOT NULL DEFAULT 'pending', "context" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc450e9c9835c88bb3d5abec4c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying, "performedBy" character varying NOT NULL, "details" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ipAddress" character varying, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_889633a4291bcb0bf4680fff23" ON "audit_logs" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs" ("entityType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "notification_preferences" jsonb`,
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
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_3451abd01aa042855d22b13bcad" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_executions" ADD CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "automation_executions" DROP CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_3451abd01aa042855d22b13bcad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa"`,
    );
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
      `ALTER TABLE "users" DROP COLUMN "notification_preferences"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_889633a4291bcb0bf4680fff23"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "automation_executions"`);
    await queryRunner.query(
      `DROP TYPE "public"."automation_executions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "announcement_reads"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(
      `DROP TYPE "public"."announcements_targettype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
