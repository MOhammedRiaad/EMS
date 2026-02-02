import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTermsTables1769376807853 implements MigrationInterface {
  name = 'CreateTermsTables1769376807853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "terms_acceptance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "terms_id" uuid NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip_address" character varying(45), "user_agent" text, CONSTRAINT "PK_23370d00ad2d55a97e1237f4594" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms_of_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "version" character varying(50) NOT NULL, "content" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e353abdd494d975c70d8c36cfeb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_aa87fd836ed6fb0d30c1893b6cf" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_3eae371bc4aafeca3a8abd6beee" FOREIGN KEY ("terms_id") REFERENCES "terms_of_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_3eae371bc4aafeca3a8abd6beee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_aa87fd836ed6fb0d30c1893b6cf"`,
    );
    await queryRunner.query(`DROP TABLE "terms_of_service"`);
    await queryRunner.query(`DROP TABLE "terms_acceptance"`);
  }
}
