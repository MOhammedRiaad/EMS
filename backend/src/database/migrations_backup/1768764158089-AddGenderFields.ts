import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderFields1768764158089 implements MigrationInterface {
  name = 'AddGenderFields1768764158089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "rooms_studio_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "rooms_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" DROP CONSTRAINT "studios_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP CONSTRAINT "coaches_studio_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP CONSTRAINT "coaches_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP CONSTRAINT "coaches_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "client_session_reviews_coach_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "client_session_reviews_client_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "client_session_reviews_session_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "client_session_reviews_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_ac3008b89c9f21c9d8c73105092"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_ems_device_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_client_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_coach_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_room_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_studio_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "clients_studio_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "clients_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "clients_tenant_id_fkey"`,
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
      `ALTER TABLE "waiting_list" DROP CONSTRAINT "FK_a46208c0e70586008b7dd3c2dde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" DROP CONSTRAINT "ems_devices_studio_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" DROP CONSTRAINT "ems_devices_tenant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" DROP CONSTRAINT "FK_b527f80be64a1e62e97e696d666"`,
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
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_77e84561125adeccf287547f66e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_rooms_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_studios_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_coaches_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reviews_coach"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_scheduling"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_room"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_coach"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_client"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_device"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clients_tenant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clients_email"`);
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "rooms_capacity_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" DROP CONSTRAINT "client_session_reviews_rating_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_intensity_level_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "valid_time_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "rooms_studio_id_name_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" DROP CONSTRAINT "studios_tenant_id_slug_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_email_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" DROP CONSTRAINT "ems_devices_studio_id_label_key"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other', 'pnts')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "gender" "public"."users_gender_enum" NOT NULL DEFAULT 'pnts'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coaches_preferred_client_gender_enum" AS ENUM('male', 'female', 'any')`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD "preferred_client_gender" "public"."coaches_preferred_client_gender_enum" NOT NULL DEFAULT 'any'`,
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
      `ALTER TYPE "public"."session_status" RENAME TO "session_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sessions_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" TYPE "public"."sessions_status_enum" USING "status"::"text"::"public"."sessions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
    await queryRunner.query(`DROP TYPE "public"."session_status_old"`);
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "status" SET NOT NULL`,
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
      `ALTER TYPE "public"."client_status" RENAME TO "client_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" TYPE "public"."clients_status_enum" USING "status"::"text"::"public"."clients_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."client_status_old"`);
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "consent_flags" SET DEFAULT '{"marketing":false,"data_processing":true}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP COLUMN "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD "tenant_id" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "waiting_list" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."waiting_list_status_enum" AS ENUM('pending', 'approved', 'notified', 'booked', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD "status" "public"."waiting_list_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."device_status" RENAME TO "device_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ems_devices_status_enum" AS ENUM('available', 'in_use', 'maintenance')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" TYPE "public"."ems_devices_status_enum" USING "status"::"text"::"public"."ems_devices_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" SET DEFAULT 'available'`,
    );
    await queryRunner.query(`DROP TYPE "public"."device_status_old"`);
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ALTER COLUMN "status" SET NOT NULL`,
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
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_30eb0b108669823992c086ff1f0" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
      `ALTER TABLE "inbody_scans" ADD CONSTRAINT "FK_46d0409b147f52214cf93a9dfe7" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD CONSTRAINT "FK_fcd3e56d7d2af93e11990d16e52" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "FK_18d76a2f21d3238587269e03678" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_77e84561125adeccf287547f66e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_77e84561125adeccf287547f66e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded"`,
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
      `ALTER TABLE "ems_devices" DROP CONSTRAINT "FK_18d76a2f21d3238587269e03678"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP CONSTRAINT "FK_fcd3e56d7d2af93e11990d16e52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP CONSTRAINT "FK_46d0409b147f52214cf93a9dfe7"`,
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
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_30eb0b108669823992c086ff1f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984"`,
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
      `ALTER TABLE "inbody_scans" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbody_scans" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "waiting_list" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."waiting_list_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD "status" character varying NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" DROP COLUMN "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD "tenant_id" uuid NOT NULL`,
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
      `CREATE TYPE "public"."user_role_old" AS ENUM('tenant_owner', 'admin', 'coach', 'client')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`,
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
      `ALTER TABLE "coaches" DROP COLUMN "preferred_client_gender"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."coaches_preferred_client_gender_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
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
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a393e904d8ad32e64d95d4d818e" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_77e84561125adeccf287547f66e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_280a2d4cddda447de1d38f02011" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_8057119bf1b4b26fcc22ac2f5f1" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_packages" ADD CONSTRAINT "FK_1be66ba5f945aa8dd3165086f84" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ADD CONSTRAINT "FK_b527f80be64a1e62e97e696d666" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "ems_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ems_devices" ADD CONSTRAINT "ems_devices_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_a46208c0e70586008b7dd3c2dde" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_7169299a5ec37b0350125811237" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_598d930189e529f7df7fe5bb7ea" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_766f87836ca7372e5762062ba85" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_16982ac7c2150c9d35e4199420d" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waiting_list" ADD CONSTRAINT "FK_fa39e14a7b8758bdecf7f05f46d" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "clients_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_ems_device_id_fkey" FOREIGN KEY ("ems_device_id") REFERENCES "ems_devices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_ac3008b89c9f21c9d8c73105092" FOREIGN KEY ("parent_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_session_reviews" ADD CONSTRAINT "client_session_reviews_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD CONSTRAINT "coaches_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "studios" ADD CONSTRAINT "studios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
