import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTransactionFields1771000000001 implements MigrationInterface {
    name = 'UpdateTransactionFields1771000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD "status" character varying(20) NOT NULL DEFAULT 'paid'`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD "payment_method" character varying(20)`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD "client_running_balance" decimal(10,2)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP COLUMN "client_running_balance"`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP COLUMN "payment_method"`,
        );
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "status"`);
    }
}
