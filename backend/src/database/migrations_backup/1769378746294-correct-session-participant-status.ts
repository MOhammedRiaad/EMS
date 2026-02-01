import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrectSessionParticipantStatus1769378746294 implements MigrationInterface {
    name = 'CorrectSessionParticipantStatus1769378746294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."session_participants_status_enum" RENAME TO "session_participants_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."session_participants_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" TYPE "public"."session_participants_status_enum" USING "status"::"text"::"public"."session_participants_status_enum"`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" SET DEFAULT 'scheduled'`);
        await queryRunner.query(`DROP TYPE "public"."session_participants_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."session_participants_status_enum_old" AS ENUM('scheduled', 'attended', 'no_show', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" TYPE "public"."session_participants_status_enum_old" USING "status"::"text"::"public"."session_participants_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "session_participants" ALTER COLUMN "status" SET DEFAULT 'scheduled'`);
        await queryRunner.query(`DROP TYPE "public"."session_participants_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."session_participants_status_enum_old" RENAME TO "session_participants_status_enum"`);
    }

}
