import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParqTables1769376188363 implements MigrationInterface {
  name = 'CreateParqTables1769376188363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "parq_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "responses" jsonb NOT NULL, "has_risk" boolean NOT NULL DEFAULT false, "signature_data" text NOT NULL, "signed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f81edd43df6ca1f8cdd9b0cc1e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "parq_responses" ADD CONSTRAINT "FK_254831bf634ae6a95a051946fb2" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parq_responses" DROP CONSTRAINT "FK_254831bf634ae6a95a051946fb2"`,
    );
    await queryRunner.query(`DROP TABLE "parq_responses"`);
  }
}
