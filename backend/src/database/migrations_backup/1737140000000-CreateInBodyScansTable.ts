import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInBodyScansTable1737140000000 implements MigrationInterface {
  name = 'CreateInBodyScansTable1737140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "inbody_scans" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" uuid NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "client_id" uuid NOT NULL,
            "scan_date" date NOT NULL,
            "weight" numeric(5,2) NOT NULL,
            "body_fat_mass" numeric(5,2) NOT NULL,
            "skeletal_muscle_mass" numeric(5,2) NOT NULL,
            "body_fat_percentage" numeric(5,2) NOT NULL,
            "right_arm_muscle" numeric(5,2),
            "left_arm_muscle" numeric(5,2),
            "trunk_muscle" numeric(5,2),
            "right_leg_muscle" numeric(5,2),
            "left_leg_muscle" numeric(5,2),
            "bmr" integer,
            "visceral_fat_level" integer,
            "body_water" numeric(5,2),
            "protein" numeric(5,2),
            "mineral" numeric(5,2),
            "notes" text,
            "created_by" uuid NOT NULL,
            CONSTRAINT "PK_inbody_scans" PRIMARY KEY ("id"),
            CONSTRAINT "FK_inbody_scans_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE,
            CONSTRAINT "FK_inbody_scans_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION,
            CONSTRAINT "FK_inbody_scans_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inbody_scans"`);
  }
}
