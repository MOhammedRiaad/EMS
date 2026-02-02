import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1769949325984 implements MigrationInterface {
  name = 'InitialSchema1769949325984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "total_sessions" integer NOT NULL, "price" numeric(10,2) NOT NULL, "validity_days" integer NOT NULL DEFAULT '30', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "package_id" uuid NOT NULL, "purchase_date" date NOT NULL, "expiry_date" date NOT NULL, "sessions_used" integer NOT NULL DEFAULT '0', "sessions_remaining" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "payment_method" character varying(20), "payment_notes" text, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2a27f35aa98f9af499ba578a30b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."session_participants_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TABLE "session_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "session_id" uuid NOT NULL, "client_id" uuid NOT NULL, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."session_participants_status_enum" NOT NULL DEFAULT 'scheduled', "client_package_id" uuid, CONSTRAINT "PK_f186de01f7f809e45eaa9bd5b84" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_waivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "waiver_id" uuid NOT NULL, "signature_data" text NOT NULL, "signed_at" TIMESTAMP NOT NULL DEFAULT now(), "ip_address" character varying(45), "user_agent" text, CONSTRAINT "PK_ba162bf25f25130f7926c8868c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "waivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "version" character varying(50) NOT NULL, "content" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_79c78ef719b30d113528b6cd9c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms_acceptance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "terms_id" uuid NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip_address" character varying(45), "user_agent" text, CONSTRAINT "PK_23370d00ad2d55a97e1237f4594" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms_of_service" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "version" character varying(50) NOT NULL, "content" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e353abdd494d975c70d8c36cfeb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_progress_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "photo_url" text NOT NULL, "taken_at" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "type" character varying(50), CONSTRAINT "PK_d3cf74dbe335ec109ac9238d0b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."waiting_list_status_enum" AS ENUM('pending', 'approved', 'notified', 'booked', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "waiting_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "client_id" uuid NOT NULL, "session_id" uuid, "studio_id" uuid NOT NULL, "coach_id" uuid, "preferred_date" date, "preferred_time_slot" character varying, "status" "public"."waiting_list_status_enum" NOT NULL DEFAULT 'pending', "requires_approval" boolean NOT NULL DEFAULT false, "priority" bigint, "approved_by" uuid, "approved_at" TIMESTAMP, "notified_at" TIMESTAMP, "notification_method" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3af55ff9231edec0da959ffc040" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying, "performedBy" character varying NOT NULL, "details" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ipAddress" character varying, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_889633a4291bcb0bf4680fff23" ON "audit_logs" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs" ("entityType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "sku" character varying(50), "category" character varying(20) NOT NULL DEFAULT 'other', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "sale_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "studio_id" uuid, "client_id" uuid, "type" character varying(20) NOT NULL, "category" character varying(30) NOT NULL, "amount" numeric(10,2) NOT NULL, "running_balance" numeric(10,2), "reference_type" character varying(50), "reference_id" uuid, "description" text, "created_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "studio_id" uuid, "client_id" uuid, "total_amount" numeric(10,2) NOT NULL, "payment_method" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'completed', "sold_by" uuid NOT NULL, "transaction_id" uuid, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "product_id" uuid NOT NULL, "studio_id" uuid, "quantity" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_3e6eefa449c5773c5fe43ab113d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "parq_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "responses" jsonb NOT NULL, "has_risk" boolean NOT NULL DEFAULT false, "signature_data" text NOT NULL, "signed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f81edd43df6ca1f8cdd9b0cc1e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."announcements_targettype_enum" AS ENUM('all', 'clients', 'coaches', 'specific_users')`,
    );
    await queryRunner.query(
      `CREATE TABLE "announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "targetType" "public"."announcements_targettype_enum" NOT NULL DEFAULT 'all', "targetUserIds" jsonb, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "announcement_reads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "announcementId" uuid NOT NULL, "userId" uuid NOT NULL, "readAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d82327e564612085a67f912bfae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "tenantId" character varying NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'info', "data" jsonb, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lead_activities_type_enum" AS ENUM('note', 'email_sent', 'status_changed', 'call', 'meeting')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lead_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lead_id" uuid NOT NULL, "type" "public"."lead_activities_type_enum" NOT NULL DEFAULT 'note', "content" text NOT NULL, "created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1aa1cc6988a817368568ca26bf1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."leads_status_enum" AS ENUM('new', 'contacted', 'trial_booked', 'converted', 'lost')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "status" "public"."leads_status_enum" NOT NULL DEFAULT 'new', "source" character varying, "notes" text, "assigned_to_id" uuid, "tenant_id" character varying NOT NULL, "studio_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('new_lead', 'inactive_client', 'birthday', 'session_completed', 'lead_status_changed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_rules_actiontype_enum" AS ENUM('send_email', 'send_sms', 'create_task', 'update_status')`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "name" character varying NOT NULL, "triggerType" "public"."automation_rules_triggertype_enum" NOT NULL, "conditions" jsonb, "actionType" "public"."automation_rules_actiontype_enum", "actionPayload" jsonb, "actions" jsonb, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_378bed501eacc036895837121c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_executions_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ruleId" uuid NOT NULL, "tenantId" character varying NOT NULL, "entityId" character varying NOT NULL, "currentStepIndex" integer NOT NULL DEFAULT '0', "nextRunAt" TIMESTAMP NOT NULL, "status" "public"."automation_executions_status_enum" NOT NULL DEFAULT 'pending', "context" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc450e9c9835c88bb3d5abec4c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_achievements_achievement_type_enum" AS ENUM('sessions_5', 'sessions_10', 'sessions_25', 'sessions_50', 'sessions_100', 'streak_7_days', 'streak_30_days', 'streak_90_days', 'body_fat_milestone_5', 'body_fat_milestone_10', 'muscle_gain_5', 'muscle_gain_10', 'first_review', 'reviews_5', 'referral')`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_achievements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "achievement_type" "public"."client_achievements_achievement_type_enum" NOT NULL, "unlocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2d5a0afb3d0f3dc84434746a24d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorite_coaches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "coach_id" uuid NOT NULL, "favorited_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18714c63d0b535d0e6aed89dbb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inbody_scans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "scan_date" date NOT NULL, "weight" numeric(5,2) NOT NULL, "body_fat_mass" numeric(5,2) NOT NULL, "skeletal_muscle_mass" numeric(5,2) NOT NULL, "body_fat_percentage" numeric(5,2) NOT NULL, "right_arm_muscle" numeric(5,2), "left_arm_muscle" numeric(5,2), "trunk_muscle" numeric(5,2), "right_leg_muscle" numeric(5,2), "left_leg_muscle" numeric(5,2), "bmr" integer, "visceral_fat_level" integer, "body_water" numeric(5,2), "protein" numeric(5,2), "mineral" numeric(5,2), "notes" text, "created_by" uuid NOT NULL, "file_url" text, "file_name" text, CONSTRAINT "PK_8e9b214697e85a060666769bceb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text NOT NULL, "requirement" character varying(100) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "active" boolean NOT NULL DEFAULT true, "reward_points" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_goals_goal_type_enum" AS ENUM('weight', 'body_fat', 'muscle_mass')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_goals_status_enum" AS ENUM('active', 'achieved', 'abandoned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "goal_type" "public"."client_goals_goal_type_enum" NOT NULL, "target_value" numeric(10,2) NOT NULL, "start_value" numeric(10,2), "deadline" date NOT NULL, "status" "public"."client_goals_status_enum" NOT NULL DEFAULT 'active', "notes" text, CONSTRAINT "PK_15b9d71f7f50f9c11b80e986589" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_challenge_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "client_id" uuid NOT NULL, "challenge_id" uuid NOT NULL, "progress" integer NOT NULL DEFAULT '0', "completed_at" TIMESTAMP WITH TIME ZONE, "reward_claimed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c895819aed96c51fe9abd8376a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other', 'pnts')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" "public"."users_gender_enum" NOT NULL DEFAULT 'pnts'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "failed_login_attempts" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lockout_until" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_two_factor_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "two_factor_secret" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_expires" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "calendar_token" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "notification_preferences" jsonb`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coaches_preferred_client_gender_enum" AS ENUM('male', 'female', 'any')`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD "preferred_client_gender" "public"."coaches_preferred_client_gender_enum" NOT NULL DEFAULT 'any'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sessions_type_enum" AS ENUM('individual', 'group')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "type" "public"."sessions_type_enum" NOT NULL DEFAULT 'individual'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "capacity" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "recurrence_pattern" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "recurrence_end_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "recurrence_days" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "parent_session_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "is_recurring_parent" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "reminder_sent_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD "client_package_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "privacy_preferences" jsonb NOT NULL DEFAULT '{"leaderboard_visible":true,"activity_feed_visible":true}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "health_goals" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "medical_history" jsonb NOT NULL DEFAULT '{"allergies":[],"injuries":[],"conditions":[]}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "credit_balance" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "capacity" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "timezone" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "opening_hours" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "plan" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "is_complete" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "features" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "settings" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('tenant_owner', 'admin', 'coach', 'client')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "specializations" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "specializations" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "availability_rules" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ALTER COLUMN "visible_to_admins" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "client_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "UQ_07a7a09b04e7b035c9d90cf4984" UNIQUE ("user_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" SET DEFAULT '{"marketing":false,"data_processing":true}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "created_at" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "FK_0f89201bf9630448b61dd805ba5" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ADD CONSTRAINT "FK_94ac7504c3a2e99405894860335" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "FK_bd9923ac72efde2d5895e118fa8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "FK_565d9b6c2fc543149f75d9be5ac" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "FK_d92f39adea26c4bcf4a91f24dbb" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "FK_1e06da2733fa58b0369ce2882cc" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "FK_46078d6e4b77e02fe64f3aec739" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ADD CONSTRAINT "FK_b527f80be64a1e62e97e696d666" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_280a2d4cddda447de1d38f02011" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_8057119bf1b4b26fcc22ac2f5f1" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_1be66ba5f945aa8dd3165086f84" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" ADD CONSTRAINT "FK_0f44aaaaf807cef66c6fa9494a8" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" ADD CONSTRAINT "FK_ed2b21a2e8b94dddfeffcfc6a4b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" ADD CONSTRAINT "FK_85fe70b0c0728b078554d242a18" FOREIGN KEY ("client_package_id") REFERENCES "client_packages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_65a90c3887db2083dda89626217" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_385ceb9a1f74fe2c97543f5453f" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_6f3fda889db6222a666ed6afac3" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_7af6ac1cd093d361012865a0a48" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_b56e02c93aa0b6190908555ed66" FOREIGN KEY ("client_package_id") REFERENCES "client_packages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_30eb0b108669823992c086ff1f0" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_waivers" ADD CONSTRAINT "FK_c16ebe1ae0c5b97376f69122acc" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_waivers" ADD CONSTRAINT "FK_5a613067ee54fd2283592165b2d" FOREIGN KEY ("waiver_id") REFERENCES "waivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_aa87fd836ed6fb0d30c1893b6cf" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" ADD CONSTRAINT "FK_3eae371bc4aafeca3a8abd6beee" FOREIGN KEY ("terms_id") REFERENCES "terms_of_service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "FK_18d76a2f21d3238587269e03678" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_progress_photos" ADD CONSTRAINT "FK_15ed863890728b77bfd829f36d9" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_7169299a5ec37b0350125811237" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_598d930189e529f7df7fe5bb7ea" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_766f87836ca7372e5762062ba85" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_16982ac7c2150c9d35e4199420d" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_fa39e14a7b8758bdecf7f05f46d" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c210a330b80232c29c2ad68462a" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_77e84561125adeccf287547f66e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_46d6229421ed38a882ab3367700" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_c49d95226945ca3a93584f912ca" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_7ad6a13e30bc3a852615bc9e90c" FOREIGN KEY ("sold_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_000ae4a84cb4f52cb1bd99e033e" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_stocks" ADD CONSTRAINT "FK_1e17816fecdb81490a1c2ae3682" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_stocks" ADD CONSTRAINT "FK_d9146fb9e21716b1ac2ea6ec1dd" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parq_responses" ADD CONSTRAINT "FK_254831bf634ae6a95a051946fb2" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" ADD CONSTRAINT "FK_3451abd01aa042855d22b13bcad" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_26316cb0e146683e9e8aee237d4" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_0586f5b6ca10dcbdc09fdc2f4cb" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_executions" ADD CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_achievements" ADD CONSTRAINT "FK_88cc101ec5ada7d6bdacf3db2df" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_coaches" ADD CONSTRAINT "FK_32b3970ecbaf7f4c2bfe970f1c4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_coaches" ADD CONSTRAINT "FK_e73eaec25116cbda701fe02d7b7" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD CONSTRAINT "FK_46d0409b147f52214cf93a9dfe7" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD CONSTRAINT "FK_fcd3e56d7d2af93e11990d16e52" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_goals" ADD CONSTRAINT "FK_1ff1cd3145f399b8eb1f42dcadc" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_challenge_progress" ADD CONSTRAINT "FK_22600c54a25642c96f48e68d43e" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_challenge_progress" ADD CONSTRAINT "FK_599d5788dff6e4694877fbcfb78" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_challenge_progress" DROP CONSTRAINT "FK_599d5788dff6e4694877fbcfb78"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_challenge_progress" DROP CONSTRAINT "FK_22600c54a25642c96f48e68d43e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_goals" DROP CONSTRAINT "FK_1ff1cd3145f399b8eb1f42dcadc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP CONSTRAINT "FK_fcd3e56d7d2af93e11990d16e52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP CONSTRAINT "FK_46d0409b147f52214cf93a9dfe7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_coaches" DROP CONSTRAINT "FK_e73eaec25116cbda701fe02d7b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_coaches" DROP CONSTRAINT "FK_32b3970ecbaf7f4c2bfe970f1c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_achievements" DROP CONSTRAINT "FK_88cc101ec5ada7d6bdacf3db2df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_executions" DROP CONSTRAINT "FK_6c64863efb57532f36d31d1bd4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_0586f5b6ca10dcbdc09fdc2f4cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_26316cb0e146683e9e8aee237d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_3451abd01aa042855d22b13bcad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_reads" DROP CONSTRAINT "FK_77c99446ffea2d8edb5b751e6aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parq_responses" DROP CONSTRAINT "FK_254831bf634ae6a95a051946fb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_stocks" DROP CONSTRAINT "FK_d9146fb9e21716b1ac2ea6ec1dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_stocks" DROP CONSTRAINT "FK_1e17816fecdb81490a1c2ae3682"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_000ae4a84cb4f52cb1bd99e033e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_7ad6a13e30bc3a852615bc9e90c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_c49d95226945ca3a93584f912ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_46d6229421ed38a882ab3367700"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_77e84561125adeccf287547f66e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_ebb352c973d8a85e8779a15ff35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c210a330b80232c29c2ad68462a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_fa39e14a7b8758bdecf7f05f46d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_16982ac7c2150c9d35e4199420d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_766f87836ca7372e5762062ba85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_598d930189e529f7df7fe5bb7ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_7169299a5ec37b0350125811237"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_progress_photos" DROP CONSTRAINT "FK_15ed863890728b77bfd829f36d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" DROP CONSTRAINT "FK_18d76a2f21d3238587269e03678"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_3eae371bc4aafeca3a8abd6beee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptance" DROP CONSTRAINT "FK_aa87fd836ed6fb0d30c1893b6cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_waivers" DROP CONSTRAINT "FK_5a613067ee54fd2283592165b2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_waivers" DROP CONSTRAINT "FK_c16ebe1ae0c5b97376f69122acc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_30eb0b108669823992c086ff1f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_b56e02c93aa0b6190908555ed66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_7af6ac1cd093d361012865a0a48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_6f3fda889db6222a666ed6afac3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_385ceb9a1f74fe2c97543f5453f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_65a90c3887db2083dda89626217"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" DROP CONSTRAINT "FK_85fe70b0c0728b078554d242a18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" DROP CONSTRAINT "FK_ed2b21a2e8b94dddfeffcfc6a4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_participants" DROP CONSTRAINT "FK_0f44aaaaf807cef66c6fa9494a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" DROP CONSTRAINT "FK_1be66ba5f945aa8dd3165086f84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" DROP CONSTRAINT "FK_8057119bf1b4b26fcc22ac2f5f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" DROP CONSTRAINT "FK_280a2d4cddda447de1d38f02011"`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" DROP CONSTRAINT "FK_b527f80be64a1e62e97e696d666"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "FK_46078d6e4b77e02fe64f3aec739"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "FK_1e06da2733fa58b0369ce2882cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "FK_d92f39adea26c4bcf4a91f24dbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP CONSTRAINT "FK_565d9b6c2fc543149f75d9be5ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP CONSTRAINT "FK_bd9923ac72efde2d5895e118fa8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" DROP CONSTRAINT "FK_94ac7504c3a2e99405894860335"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "FK_0f89201bf9630448b61dd805ba5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_status_old" AS ENUM('available', 'in_use', 'maintenance')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" TYPE "public"."device_status_old" USING "status"::"text"::"public"."device_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" SET DEFAULT 'available'`,
    );
    await queryRunner.query(`DROP TYPE "public"."ems_devices_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."device_status_old" RENAME TO "device_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" SET DEFAULT '{"marketing": false, "data_processing": true}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_status_old" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" TYPE "public"."client_status_old" USING "status"::"text"::"public"."client_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."clients_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."client_status_old" RENAME TO "client_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "UQ_07a7a09b04e7b035c9d90cf4984"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."session_status_old" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" TYPE "public"."session_status_old" USING "status"::"text"::"public"."session_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
    await queryRunner.query(`DROP TYPE "public"."sessions_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."session_status_old" RENAME TO "session_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "client_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ALTER COLUMN "visible_to_admins" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "availability_rules" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "specializations" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "specializations" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email_verified" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "settings" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "features" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "is_complete" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "plan" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "opening_hours" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "timezone" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "capacity" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "credit_balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "medical_history"`,
    );
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "health_goals"`);
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "privacy_preferences"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "client_package_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "reminder_sent_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "is_recurring_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "parent_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "recurrence_days"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "recurrence_end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "recurrence_pattern"`,
    );
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "capacity"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."sessions_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN "preferred_client_gender"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."coaches_preferred_client_gender_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "notification_preferences"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "calendar_token"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "two_factor_secret"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "is_two_factor_enabled"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lockout_until"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
    await queryRunner.query(`DROP TABLE "client_challenge_progress"`);
    await queryRunner.query(`DROP TABLE "client_goals"`);
    await queryRunner.query(`DROP TYPE "public"."client_goals_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."client_goals_goal_type_enum"`);
    await queryRunner.query(`DROP TABLE "challenges"`);
    await queryRunner.query(`DROP TABLE "inbody_scans"`);
    await queryRunner.query(`DROP TABLE "favorite_coaches"`);
    await queryRunner.query(`DROP TABLE "client_achievements"`);
    await queryRunner.query(
      `DROP TYPE "public"."client_achievements_achievement_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "automation_executions"`);
    await queryRunner.query(
      `DROP TYPE "public"."automation_executions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "automation_rules"`);
    await queryRunner.query(
      `DROP TYPE "public"."automation_rules_actiontype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."automation_rules_triggertype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
    await queryRunner.query(`DROP TABLE "lead_activities"`);
    await queryRunner.query(`DROP TYPE "public"."lead_activities_type_enum"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "announcement_reads"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(
      `DROP TYPE "public"."announcements_targettype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "parq_responses"`);
    await queryRunner.query(`DROP TABLE "product_stocks"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "sale_items"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_889633a4291bcb0bf4680fff23"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "waiting_list"`);
    await queryRunner.query(`DROP TYPE "public"."waiting_list_status_enum"`);
    await queryRunner.query(`DROP TABLE "client_progress_photos"`);
    await queryRunner.query(`DROP TABLE "terms_of_service"`);
    await queryRunner.query(`DROP TABLE "terms_acceptance"`);
    await queryRunner.query(`DROP TABLE "waivers"`);
    await queryRunner.query(`DROP TABLE "client_waivers"`);
    await queryRunner.query(`DROP TABLE "session_participants"`);
    await queryRunner.query(
      `DROP TYPE "public"."session_participants_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "client_packages"`);
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "ems_devices_studio_id_label_key" UNIQUE ("studio_id", "label")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_email_key" UNIQUE ("tenant_id", "email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ADD CONSTRAINT "studios_tenant_id_slug_key" UNIQUE ("tenant_id", "slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_studio_id_name_key" UNIQUE ("studio_id", "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "valid_time_range" CHECK ((end_time > start_time))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_intensity_level_check" CHECK (((intensity_level >= 1) AND (intensity_level <= 10)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_capacity_check" CHECK ((capacity > 0))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clients_email" ON "clients" ("email") WHERE (email IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clients_tenant" ON "clients" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_device" ON "sessions" ("ems_device_id", "start_time", "end_time") WHERE ((status <> 'cancelled'::session_status) AND (ems_device_id IS NOT NULL))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_client" ON "sessions" ("client_id", "start_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_coach" ON "sessions" ("coach_id", "start_time", "end_time") WHERE (status <> 'cancelled'::session_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_room" ON "sessions" ("room_id", "start_time", "end_time") WHERE (status <> 'cancelled'::session_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_scheduling" ON "sessions" ("studio_id", "start_time", "end_time") WHERE (status <> 'cancelled'::session_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_tenant" ON "sessions" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_reviews_coach" ON "client_session_reviews" ("coach_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_coaches_tenant" ON "coaches" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant" ON "users" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_studios_tenant" ON "studios" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rooms_tenant" ON "rooms" ("tenant_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "ems_devices_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "ems_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_ems_device_id_fkey" FOREIGN KEY ("ems_device_id") REFERENCES "ems_devices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ADD CONSTRAINT "studios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
