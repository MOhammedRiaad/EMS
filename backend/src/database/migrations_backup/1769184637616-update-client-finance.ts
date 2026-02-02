import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateClientFinance1769184637616 implements MigrationInterface {
  name = 'UpdateClientFinance1769184637616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "credit_balance" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "client_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "client_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "credit_balance"`,
    );
  }
}
