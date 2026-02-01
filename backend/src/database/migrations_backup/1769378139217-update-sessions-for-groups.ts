import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSessionsForGroups1769378139217 implements MigrationInterface {
    name = 'UpdateSessionsForGroups1769378139217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "session_id" uuid NOT NULL, "client_id" uuid NOT NULL, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f186de01f7f809e45eaa9bd5b84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sessions_type_enum" AS ENUM('individual', 'group')`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "type" "public"."sessions_type_enum" NOT NULL DEFAULT 'individual'`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "capacity" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_7af6ac1cd093d361012865a0a48"`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "client_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_participants" ADD CONSTRAINT "FK_0f44aaaaf807cef66c6fa9494a8" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_participants" ADD CONSTRAINT "FK_ed2b21a2e8b94dddfeffcfc6a4b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_7af6ac1cd093d361012865a0a48" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_7af6ac1cd093d361012865a0a48"`);
        await queryRunner.query(`ALTER TABLE "session_participants" DROP CONSTRAINT "FK_ed2b21a2e8b94dddfeffcfc6a4b"`);
        await queryRunner.query(`ALTER TABLE "session_participants" DROP CONSTRAINT "FK_0f44aaaaf807cef66c6fa9494a8"`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "client_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_7af6ac1cd093d361012865a0a48" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "capacity"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."sessions_type_enum"`);
        await queryRunner.query(`DROP TABLE "session_participants"`);
    }

}
