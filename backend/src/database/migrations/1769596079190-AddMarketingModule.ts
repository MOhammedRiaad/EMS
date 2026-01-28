import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarketingModule1769596079190 implements MigrationInterface {
    name = 'AddMarketingModule1769596079190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lead_activities_type_enum" AS ENUM('note', 'email_sent', 'status_changed', 'call', 'meeting')`);
        await queryRunner.query(`CREATE TABLE "lead_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lead_id" uuid NOT NULL, "type" "public"."lead_activities_type_enum" NOT NULL DEFAULT 'note', "content" text NOT NULL, "created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1aa1cc6988a817368568ca26bf1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leads_status_enum" AS ENUM('new', 'contacted', 'trial_booked', 'converted', 'lost')`);
        await queryRunner.query(`CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "status" "public"."leads_status_enum" NOT NULL DEFAULT 'new', "source" character varying, "notes" text, "assigned_to_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('new_lead', 'inactive_client', 'birthday', 'session_completed', 'lead_status_changed')`);
        await queryRunner.query(`CREATE TYPE "public"."automation_rules_actiontype_enum" AS ENUM('send_email', 'send_sms', 'create_task', 'update_status')`);
        await queryRunner.query(`CREATE TABLE "automation_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "triggerType" "public"."automation_rules_triggertype_enum" NOT NULL, "conditions" jsonb, "actionType" "public"."automation_rules_actiontype_enum" NOT NULL, "actionPayload" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_378bed501eacc036895837121c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_26316cb0e146683e9e8aee237d4" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_0586f5b6ca10dcbdc09fdc2f4cb" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80"`);
        await queryRunner.query(`ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_0586f5b6ca10dcbdc09fdc2f4cb"`);
        await queryRunner.query(`ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_26316cb0e146683e9e8aee237d4"`);
        await queryRunner.query(`DROP TABLE "automation_rules"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_actiontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."automation_rules_triggertype_enum"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
        await queryRunner.query(`DROP TABLE "lead_activities"`);
        await queryRunner.query(`DROP TYPE "public"."lead_activities_type_enum"`);
    }

}
