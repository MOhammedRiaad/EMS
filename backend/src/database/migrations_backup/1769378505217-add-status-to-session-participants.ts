import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToSessionParticipants1769378505217 implements MigrationInterface {
  name = 'AddStatusToSessionParticipants1769378505217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."session_participants_status_enum" AS ENUM('scheduled', 'attended', 'no_show', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" ADD "status" "public"."session_participants_status_enum" NOT NULL DEFAULT 'scheduled'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_participants" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."session_participants_status_enum"`,
    );
  }
}
