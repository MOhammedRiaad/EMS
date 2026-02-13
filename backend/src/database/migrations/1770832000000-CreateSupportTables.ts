import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTables1770832000000 implements MigrationInterface {
    name = 'CreateSupportTables1770832000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Enums
        await queryRunner.query(
            `CREATE TYPE "public"."support_ticket_status_enum" AS ENUM('open', 'in_progress', 'resolved', 'closed')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."support_ticket_priority_enum" AS ENUM('low', 'medium', 'high', 'critical')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."support_ticket_category_enum" AS ENUM('billing', 'technical', 'feature_request', 'other')`
        );

        // Create support_ticket table
        await queryRunner.query(
            `CREATE TABLE "support_ticket" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "subject" character varying NOT NULL, 
                "message" text NOT NULL, 
                "status" "public"."support_ticket_status_enum" NOT NULL DEFAULT 'open', 
                "priority" "public"."support_ticket_priority_enum" NOT NULL DEFAULT 'medium', 
                "category" "public"."support_ticket_category_enum" NOT NULL DEFAULT 'other', 
                "tenantId" uuid NOT NULL, 
                "userId" uuid NOT NULL, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_5d6e2e7b8c2d1b0d2b3c4d5e6f7" PRIMARY KEY ("id")
            )`
        );

        // Create ticket_message table
        await queryRunner.query(
            `CREATE TABLE "ticket_message" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "ticketId" uuid NOT NULL, 
                "userId" uuid NOT NULL, 
                "message" text NOT NULL, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_a1b2c3d4e5f6g7h8i9j0k1l2m3n" PRIMARY KEY ("id")
            )`
        );

        // Add Indices
        await queryRunner.query(`CREATE INDEX "IDX_support_ticket_tenantId" ON "support_ticket" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_support_ticket_userId" ON "support_ticket" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_message_ticketId" ON "ticket_message" ("ticketId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_message_userId" ON "ticket_message" ("userId")`);

        // Add Foreign Keys
        await queryRunner.query(
            `ALTER TABLE "support_ticket" ADD CONSTRAINT "FK_support_ticket_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "support_ticket" ADD CONSTRAINT "FK_support_ticket_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ticket_message" ADD CONSTRAINT "FK_ticket_message_ticket" FOREIGN KEY ("ticketId") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "ticket_message" ADD CONSTRAINT "FK_ticket_message_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_ticket_message_user"`);
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_ticket_message_ticket"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_support_ticket_user"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_support_ticket_tenant"`);

        await queryRunner.query(`DROP INDEX "IDX_ticket_message_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_message_ticketId"`);
        await queryRunner.query(`DROP INDEX "IDX_support_ticket_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_support_ticket_tenantId"`);

        await queryRunner.query(`DROP TABLE "ticket_message"`);
        await queryRunner.query(`DROP TABLE "support_ticket"`);

        await queryRunner.query(`DROP TYPE "public"."support_ticket_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."support_ticket_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."support_ticket_status_enum"`);
    }
}
