import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookedTimeToSessions1770100000009 implements MigrationInterface {
  name = 'AddBookedTimeToSessions1770100000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "booked_start_time" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "booked_end_time" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "booked_end_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "booked_start_time"`,
    );
  }
}
