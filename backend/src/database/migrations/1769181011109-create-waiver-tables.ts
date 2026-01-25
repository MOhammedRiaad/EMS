import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWaiverTables1769181011109 implements MigrationInterface {
    name = 'CreateWaiverTables1769181011109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "client_waivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "waiver_id" uuid NOT NULL, "signature_data" text NOT NULL, "signed_at" TIMESTAMP NOT NULL DEFAULT now(), "ip_address" character varying(45), "user_agent" text, CONSTRAINT "PK_ba162bf25f25130f7926c8868c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "waivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "version" character varying(50) NOT NULL, "content" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_79c78ef719b30d113528b6cd9c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "client_waivers" ADD CONSTRAINT "FK_c16ebe1ae0c5b97376f69122acc" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_waivers" ADD CONSTRAINT "FK_5a613067ee54fd2283592165b2d" FOREIGN KEY ("waiver_id") REFERENCES "waivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_waivers" DROP CONSTRAINT "FK_5a613067ee54fd2283592165b2d"`);
        await queryRunner.query(`ALTER TABLE "client_waivers" DROP CONSTRAINT "FK_c16ebe1ae0c5b97376f69122acc"`);
        await queryRunner.query(`DROP TABLE "waivers"`);
        await queryRunner.query(`DROP TABLE "client_waivers"`);
    }

}
