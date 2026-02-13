import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformRevenueTable1770834000000 implements MigrationInterface {
    name = 'CreatePlatformRevenueTable1770834000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Enums
        await queryRunner.query(
            `CREATE TYPE "public"."platform_revenue_status_enum" AS ENUM('pending', 'completed', 'failed', 'refunded')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."platform_revenue_type_enum" AS ENUM('subscription', 'setup_fee', 'adhoc')`
        );

        // Create platform_revenue table
        await queryRunner.query(
            `CREATE TABLE "platform_revenue" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "amount" decimal(10,2) NOT NULL, 
                "status" "public"."platform_revenue_status_enum" NOT NULL DEFAULT 'completed', 
                "type" "public"."platform_revenue_type_enum" NOT NULL DEFAULT 'subscription', 
                "external_reference" character varying, 
                "billing_period_start" TIMESTAMP WITH TIME ZONE, 
                "billing_period_end" TIMESTAMP WITH TIME ZONE, 
                "notes" text, 
                "tenant_id" uuid NOT NULL, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_platform_revenue" PRIMARY KEY ("id")
            )`
        );

        // Add Index
        await queryRunner.query(`CREATE INDEX "IDX_platform_revenue_tenant_id" ON "platform_revenue" ("tenant_id")`);

        // Add Foreign Key
        await queryRunner.query(
            `ALTER TABLE "platform_revenue" ADD CONSTRAINT "FK_platform_revenue_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_revenue" DROP CONSTRAINT "FK_platform_revenue_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_platform_revenue_tenant_id"`);
        await queryRunner.query(`DROP TABLE "platform_revenue"`);
        await queryRunner.query(`DROP TYPE "public"."platform_revenue_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."platform_revenue_status_enum"`);
    }
}
