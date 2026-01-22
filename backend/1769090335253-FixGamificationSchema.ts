import { MigrationInterface, QueryRunner } from "typeorm";

export class FixGamificationSchema1769090335253 implements MigrationInterface {
    name = 'FixGamificationSchema1769090335253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "requirement" character varying(100) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "active" boolean NOT NULL DEFAULT true, "reward_points" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client_challenge_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "challenge_id" uuid NOT NULL, "progress" integer NOT NULL DEFAULT '0', "completed_at" TIMESTAMP WITH TIME ZONE, "reward_claimed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c895819aed96c51fe9abd8376a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."client_achievements_achievement_type_enum" AS ENUM('sessions_5', 'sessions_10', 'sessions_25', 'sessions_50', 'sessions_100', 'streak_7_days', 'streak_30_days', 'streak_90_days', 'body_fat_milestone_5', 'body_fat_milestone_10', 'muscle_gain_5', 'muscle_gain_10', 'first_review', 'reviews_5', 'referral')`);
        await queryRunner.query(`CREATE TABLE "client_achievements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "achievement_type" "public"."client_achievements_achievement_type_enum" NOT NULL, "unlocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2d5a0afb3d0f3dc84434746a24d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "favorite_coaches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "coach_id" uuid NOT NULL, "favorited_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18714c63d0b535d0e6aed89dbb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."client_goals_goal_type_enum" AS ENUM('weight', 'body_fat', 'muscle_mass')`);
        await queryRunner.query(`CREATE TYPE "public"."client_goals_status_enum" AS ENUM('active', 'achieved', 'abandoned')`);
        await queryRunner.query(`CREATE TABLE "client_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "goal_type" "public"."client_goals_goal_type_enum" NOT NULL, "target_value" numeric(10,2) NOT NULL, "start_value" numeric(10,2), "deadline" date NOT NULL, "status" "public"."client_goals_status_enum" NOT NULL DEFAULT 'active', "notes" text, CONSTRAINT "PK_15b9d71f7f50f9c11b80e986589" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "privacy_preferences"`);
        await queryRunner.query(`ALTER TABLE "client_challenge_progress" ADD CONSTRAINT "FK_22600c54a25642c96f48e68d43e" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_challenge_progress" ADD CONSTRAINT "FK_599d5788dff6e4694877fbcfb78" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_achievements" ADD CONSTRAINT "FK_88cc101ec5ada7d6bdacf3db2df" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite_coaches" ADD CONSTRAINT "FK_32b3970ecbaf7f4c2bfe970f1c4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite_coaches" ADD CONSTRAINT "FK_e73eaec25116cbda701fe02d7b7" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_goals" ADD CONSTRAINT "FK_1ff1cd3145f399b8eb1f42dcadc" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_goals" DROP CONSTRAINT "FK_1ff1cd3145f399b8eb1f42dcadc"`);
        await queryRunner.query(`ALTER TABLE "favorite_coaches" DROP CONSTRAINT "FK_e73eaec25116cbda701fe02d7b7"`);
        await queryRunner.query(`ALTER TABLE "favorite_coaches" DROP CONSTRAINT "FK_32b3970ecbaf7f4c2bfe970f1c4"`);
        await queryRunner.query(`ALTER TABLE "client_achievements" DROP CONSTRAINT "FK_88cc101ec5ada7d6bdacf3db2df"`);
        await queryRunner.query(`ALTER TABLE "client_challenge_progress" DROP CONSTRAINT "FK_599d5788dff6e4694877fbcfb78"`);
        await queryRunner.query(`ALTER TABLE "client_challenge_progress" DROP CONSTRAINT "FK_22600c54a25642c96f48e68d43e"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "privacy_preferences" jsonb NOT NULL DEFAULT '{"leaderboard_visible": true, "activity_feed_visible": true}'`);
        await queryRunner.query(`DROP TABLE "client_goals"`);
        await queryRunner.query(`DROP TYPE "public"."client_goals_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."client_goals_goal_type_enum"`);
        await queryRunner.query(`DROP TABLE "favorite_coaches"`);
        await queryRunner.query(`DROP TABLE "client_achievements"`);
        await queryRunner.query(`DROP TYPE "public"."client_achievements_achievement_type_enum"`);
        await queryRunner.query(`DROP TABLE "client_challenge_progress"`);
        await queryRunner.query(`DROP TABLE "challenges"`);
    }

}
