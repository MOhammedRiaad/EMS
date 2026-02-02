import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTimeOffToTimestamp1769950000000 implements MigrationInterface {
    name = 'UpdateTimeOffToTimestamp1769950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`SELECT to_regclass('public.coach_time_off_requests')`);

        if (!tableExists[0].to_regclass) {
            // Create table
            await queryRunner.query(`CREATE TABLE "coach_time_off_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "tenant_id" uuid NOT NULL, 
                "coach_id" uuid NOT NULL, 
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "notes" text, 
                "status" character varying NOT NULL DEFAULT 'pending', 
                "reviewed_by" uuid, 
                "reviewed_at" TIMESTAMP WITH TIME ZONE, 
                "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_coach_time_off_req" PRIMARY KEY ("id")
            )`);

            await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ADD CONSTRAINT "FK_coach_time_off_coach" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ADD CONSTRAINT "FK_coach_time_off_reviewer" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        } else {
            // Alter existing columns to timestamp
            await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "start_date" TYPE TIMESTAMP WITH TIME ZONE USING "start_date"::timestamp with time zone`);
            await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "end_date" TYPE TIMESTAMP WITH TIME ZONE USING "end_date"::timestamp with time zone`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "start_date" TYPE DATE`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "end_date" TYPE DATE`);
    }
}
