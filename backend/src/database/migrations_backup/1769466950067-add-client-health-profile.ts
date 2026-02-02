import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientHealthProfile1769466950067 implements MigrationInterface {
  name = 'AddClientHealthProfile1769466950067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "client_progress_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "photo_url" text NOT NULL, "taken_at" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "type" character varying(50), CONSTRAINT "PK_d3cf74dbe335ec109ac9238d0b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "health_goals" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "medical_history" jsonb NOT NULL DEFAULT '{"allergies":[],"injuries":[],"conditions":[]}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_progress_photos" ADD CONSTRAINT "FK_15ed863890728b77bfd829f36d9" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_progress_photos" DROP CONSTRAINT "FK_15ed863890728b77bfd829f36d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "medical_history"`,
    );
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "health_goals"`);
    await queryRunner.query(`DROP TABLE "client_progress_photos"`);
  }
}
