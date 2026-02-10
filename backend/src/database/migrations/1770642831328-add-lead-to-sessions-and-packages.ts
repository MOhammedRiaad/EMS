import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadToSessionsAndPackages1770642831328 implements MigrationInterface {
  name = 'AddLeadToSessionsAndPackages1770642831328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lead_id to sessions
    await queryRunner.query(`ALTER TABLE "sessions" ADD "lead_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_lead" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL`,
    );

    // Add lead_id to client_packages
    await queryRunner.query(`ALTER TABLE "client_packages" ADD "lead_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_client_packages_lead" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL`,
    );

    // Make client_id nullable in client_packages
    await queryRunner.query(
      `ALTER TABLE "client_packages" ALTER COLUMN "client_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_packages" ALTER COLUMN "client_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" DROP CONSTRAINT "FK_client_packages_lead"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" DROP COLUMN "lead_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_lead"`,
    );
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "lead_id"`);
  }
}
