import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionFields1770981307347 implements MigrationInterface {
    name = 'AddSubscriptionFields1770981307347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_packages" DROP CONSTRAINT "FK_client_packages_lead"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_lead"`);
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_ticket_message_user"`);
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_ticket_message_ticket"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_support_ticket_user"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_support_ticket_tenant"`);
        await queryRunner.query(`ALTER TABLE "platform_revenue" DROP CONSTRAINT "FK_platform_revenue_tenant"`);
        await queryRunner.query(`ALTER TABLE "usage_metrics" DROP CONSTRAINT "usage_metrics_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "owner_audit_logs" DROP CONSTRAINT "owner_audit_logs_target_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "plan_upgrade_requests_reviewed_by_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "plan_upgrade_requests_requested_by_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "plan_upgrade_requests_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" DROP CONSTRAINT "feature_assignments_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" DROP CONSTRAINT "FK_coach_time_off_reviewer"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" DROP CONSTRAINT "FK_coach_time_off_coach"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "roles_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "client_documents_uploaded_by_fkey"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "client_documents_tenant_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "client_documents_client_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_assigned_by_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."idx_rooms_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_studios_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tenants_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tenants_is_blocked"`);
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
        await queryRunner.query(`DROP INDEX "public"."idx_permissions_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_permissions_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ticket_message_ticketId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ticket_message_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_support_ticket_tenantId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_support_ticket_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_platform_revenue_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_metrics_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_metrics_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_metrics_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_metrics_composite"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plans_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feature_flags_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feature_flags_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_system_settings_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_owner_audit_logs_owner"`);
        await queryRunner.query(`DROP INDEX "public"."idx_owner_audit_logs_action"`);
        await queryRunner.query(`DROP INDEX "public"."idx_owner_audit_logs_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_owner_audit_logs_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_upgrade_requests_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_plan_upgrade_requests_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feature_assignments_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feature_assignments_feature"`);
        await queryRunner.query(`DROP INDEX "public"."idx_broadcast_messages_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_broadcast_messages_created_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_roles_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_roles_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_documents_client_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_documents_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_client_documents_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_roles_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_roles_role"`);
        await queryRunner.query(`DROP INDEX "public"."idx_role_permissions_role"`);
        await queryRunner.query(`DROP INDEX "public"."idx_role_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "client_documents_category_check"`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" DROP CONSTRAINT "feature_assignments_tenant_id_feature_key_key"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_role_id_key"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" DROP COLUMN "updated_at"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_billing_cycle_enum" AS ENUM('monthly', 'annually')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "billing_cycle" "public"."tenants_billing_cycle_enum" NOT NULL DEFAULT 'monthly'::"public"."tenants_billing_cycle_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "subscription_ends_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "auto_renew" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "trial_ends_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status_enum') THEN
                ALTER TYPE "public"."tenant_status_enum" RENAME TO "tenant_status_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenants_status_enum') THEN
                CREATE TYPE "public"."tenants_status_enum" AS ENUM('trial', 'active', 'suspended', 'blocked');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "public"."tenants_status_enum" USING "status"::"text"::"public"."tenants_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."tenants_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "is_blocked" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "must_change_password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "packages" ALTER COLUMN "low_session_threshold" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "usage_metrics" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "features" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "default_enabled" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "dependencies" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "is_experimental" SET NOT NULL`);

        // --- NON-DESTRUCTIVE system_settings CHANGES ---
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_pkey"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "key" TYPE character varying, ALTER COLUMN "key" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "PK_b1b5bc664526d375c94ce9ad43d" PRIMARY KEY ("key")`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "description" TYPE character varying`);

        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_settings_category_enum') THEN
                CREATE TYPE "public"."system_settings_category_enum" AS ENUM('retention', 'security', 'maintenance', 'system', 'branding');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" TYPE "public"."system_settings_category_enum" USING "category"::"text"::"public"."system_settings_category_enum"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" SET DEFAULT 'system'::"public"."system_settings_category_enum"`);

        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt"::timestamp`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updatedAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "owner_audit_logs" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp, ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upgrade_request_status_enum') THEN
                ALTER TYPE "public"."upgrade_request_status_enum" RENAME TO "upgrade_request_status_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_upgrade_requests_status_enum') THEN
                CREATE TYPE "public"."plan_upgrade_requests_status_enum" AS ENUM('pending', 'approved', 'rejected');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" TYPE "public"."plan_upgrade_requests_status_enum" USING "status"::"text"::"public"."plan_upgrade_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."plan_upgrade_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."upgrade_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "enabled" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "enabled_at" TYPE TIMESTAMP USING "enabled_at"::timestamp, ALTER COLUMN "enabled_at" SET NOT NULL, ALTER COLUMN "enabled_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "subject" TYPE character varying`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_type_enum') THEN
                ALTER TYPE "public"."broadcast_type_enum" RENAME TO "broadcast_type_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_type_enum') THEN
                CREATE TYPE "public"."broadcast_messages_type_enum" AS ENUM('EMAIL', 'SMS', 'IN_APP');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" TYPE "public"."broadcast_messages_type_enum" USING "type"::"text"::"public"."broadcast_messages_type_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" SET DEFAULT 'EMAIL'::"public"."broadcast_messages_type_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_type_enum_old"`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_audience_enum') THEN
                ALTER TYPE "public"."broadcast_audience_enum" RENAME TO "broadcast_audience_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_targetaudience_enum') THEN
                CREATE TYPE "public"."broadcast_messages_targetaudience_enum" AS ENUM('ALL_TENANTS', 'TENANT_OWNERS', 'ALL_COACHES', 'ALL_CLIENTS', 'SPECIFIC_PLANS');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" TYPE "public"."broadcast_messages_targetaudience_enum" USING "targetAudience"::"text"::"public"."broadcast_messages_targetaudience_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" SET DEFAULT 'ALL_TENANTS'::"public"."broadcast_messages_targetaudience_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" SET NOT NULL`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_audience_enum_old"`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_status_enum') THEN
                ALTER TYPE "public"."broadcast_status_enum" RENAME TO "broadcast_status_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_status_enum') THEN
                CREATE TYPE "public"."broadcast_messages_status_enum" AS ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" TYPE "public"."broadcast_messages_status_enum" USING "status"::"text"::"public"."broadcast_messages_status_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."broadcast_messages_status_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_status_enum_old"`);

        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "scheduledAt" TYPE TIMESTAMP USING "scheduledAt"::timestamp`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "sentAt" TYPE TIMESTAMP USING "sentAt"::timestamp`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt"::timestamp, ALTER COLUMN "createdAt" SET NOT NULL, ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt"::timestamp, ALTER COLUMN "updatedAt" SET NOT NULL, ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_time_off_requests_status_enum') THEN
                CREATE TYPE "public"."coach_time_off_requests_status_enum" AS ENUM('pending', 'approved', 'rejected');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" TYPE "public"."coach_time_off_requests_status_enum" USING "status"::"text"::"public"."coach_time_off_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."coach_time_off_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "requested_at" TYPE TIMESTAMP USING "requested_at"::timestamp, ALTER COLUMN "requested_at" SET NOT NULL, ALTER COLUMN "requested_at" SET DEFAULT now()`);

        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_system_role" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::timestamptz, ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::timestamptz, ALTER COLUMN "updated_at" SET NOT NULL, ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "tenant_id" TYPE character varying USING "tenant_id"::text, ALTER COLUMN "tenant_id" SET NOT NULL`);

        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_documents_category_enum') THEN
                CREATE TYPE "public"."client_documents_category_enum" AS ENUM('contract', 'waiver', 'medical', 'certificate', 'other');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" TYPE "public"."client_documents_category_enum" USING "category"::"text"::"public"."client_documents_category_enum"`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" SET DEFAULT 'other'::"public"."client_documents_category_enum"`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "assigned_at" TYPE TIMESTAMP USING "assigned_at"::timestamp, ALTER COLUMN "assigned_at" SET NOT NULL, ALTER COLUMN "assigned_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_4a8ffd97be06a971781d2ecbe0" ON "ticket_message" ("ticketId") `);
        await queryRunner.query(`CREATE INDEX "IDX_39f82b741fc4ac6b70a0fe69fb" ON "ticket_message" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3ce2c6eecdf330a75533df2ee" ON "support_ticket" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7df66b3c96ac736a25423c54e2" ON "support_ticket" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba294a228284c2fdd5ce888d8d" ON "usage_metrics" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_28041dbf870b19ee334fef6b6a" ON "usage_metrics" ("metric_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_cf2c079231f2b8d18518595517" ON "usage_metrics" ("date") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba664cf7249a5b806f57045a43" ON "usage_metrics" ("tenant_id", "metric_type", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_3cc7821ba13bfbf9df534b5a42" ON "owner_audit_logs" ("owner_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_46547da8569aedd389d50a348c" ON "owner_audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_17ef6dcd891675113a6a8a9899" ON "owner_audit_logs" ("target_tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_82868364c5d6ea097533f2e625" ON "owner_audit_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b37d4c385d5cfbe641f70a5b7" ON "plan_upgrade_requests" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_772718acb1bcb70ef89eb2233e" ON "plan_upgrade_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3b95e91ffde21eadd440242640" ON "feature_assignments" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca0ea4b5d2df1e8ebc978fa610" ON "feature_assignments" ("feature_key") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2461db0f2851965d7bf5d1b6cd" ON "feature_assignments" ("tenant_id", "feature_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "client_packages" ADD CONSTRAINT "FK_65eb688defe75a8066d54eca295" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_e5c74c78f69edf237206c8a02e1" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_message" ADD CONSTRAINT "FK_4a8ffd97be06a971781d2ecbe06" FOREIGN KEY ("ticketId") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_message" ADD CONSTRAINT "FK_39f82b741fc4ac6b70a0fe69fb7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "support_ticket" ADD CONSTRAINT "FK_d3ce2c6eecdf330a75533df2ee7" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "support_ticket" ADD CONSTRAINT "FK_7df66b3c96ac736a25423c54e2d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_revenue" ADD CONSTRAINT "FK_55429b670824a3afe12d294737c" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "FK_0b37d4c385d5cfbe641f70a5b74" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "FK_24ec9ed4700e81550b0e8ed7a8a" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "FK_75ab53d6570b80dbc9f8202d550" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ADD CONSTRAINT "FK_ed48beb30c35b9d848edf87e5ba" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ADD CONSTRAINT "FK_df72901b5af9f51bfed525d0b17" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_documents" ADD CONSTRAINT "FK_15a8218b7e8e9fbe7a95ad0843b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_documents" ADD CONSTRAINT "FK_93505caac75147b6d666ec317c2" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "FK_93505caac75147b6d666ec317c2"`);
        await queryRunner.query(`ALTER TABLE "client_documents" DROP CONSTRAINT "FK_15a8218b7e8e9fbe7a95ad0843b"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" DROP CONSTRAINT "FK_df72901b5af9f51bfed525d0b17"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" DROP CONSTRAINT "FK_ed48beb30c35b9d848edf87e5ba"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "FK_75ab53d6570b80dbc9f8202d550"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "FK_24ec9ed4700e81550b0e8ed7a8a"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" DROP CONSTRAINT "FK_0b37d4c385d5cfbe641f70a5b74"`);
        await queryRunner.query(`ALTER TABLE "platform_revenue" DROP CONSTRAINT "FK_55429b670824a3afe12d294737c"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_7df66b3c96ac736a25423c54e2d"`);
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP CONSTRAINT "FK_d3ce2c6eecdf330a75533df2ee7"`);
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_39f82b741fc4ac6b70a0fe69fb7"`);
        await queryRunner.query(`ALTER TABLE "ticket_message" DROP CONSTRAINT "FK_4a8ffd97be06a971781d2ecbe06"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_e5c74c78f69edf237206c8a02e1"`);
        await queryRunner.query(`ALTER TABLE "client_packages" DROP CONSTRAINT "FK_65eb688defe75a8066d54eca295"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2461db0f2851965d7bf5d1b6cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca0ea4b5d2df1e8ebc978fa610"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b95e91ffde21eadd440242640"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_772718acb1bcb70ef89eb2233e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b37d4c385d5cfbe641f70a5b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82868364c5d6ea097533f2e625"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17ef6dcd891675113a6a8a9899"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46547da8569aedd389d50a348c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cc7821ba13bfbf9df534b5a42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba664cf7249a5b806f57045a43"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf2c079231f2b8d18518595517"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28041dbf870b19ee334fef6b6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba294a228284c2fdd5ce888d8d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7df66b3c96ac736a25423c54e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3ce2c6eecdf330a75533df2ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39f82b741fc4ac6b70a0fe69fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a8ffd97be06a971781d2ecbe0"`);
        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "assigned_at" TYPE TIMESTAMP WITH TIME ZONE USING "assigned_at"::timestamptz, ALTER COLUMN "assigned_at" SET DEFAULT now()`);

        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" TYPE character varying(20) USING "category"::"text"::"character varying"`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "category" SET DEFAULT 'other'::character varying`);
        await queryRunner.query(`DROP TYPE "public"."client_documents_category_enum"`);

        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "tenant_id" TYPE uuid USING "tenant_id"::"text"::"uuid"`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "updated_at" TYPE TIMESTAMP USING "updated_at"::timestamp`);
        await queryRunner.query(`ALTER TABLE "client_documents" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`);

        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_system_role" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" DROP NOT NULL`);

        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "requested_at" TYPE TIMESTAMP WITH TIME ZONE USING "requested_at"::timestamptz`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" TYPE character varying USING "status"::"text"::"character varying"`);
        await queryRunner.query(`ALTER TABLE "coach_time_off_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::character varying`);
        await queryRunner.query(`DROP TYPE "public"."coach_time_off_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE USING "updatedAt"::timestamptz, ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt"::timestamptz, ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "sentAt" TYPE TIMESTAMP WITH TIME ZONE USING "sentAt"::timestamptz`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "scheduledAt" TYPE TIMESTAMP WITH TIME ZONE USING "scheduledAt"::timestamptz`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_status_enum') THEN
                ALTER TYPE "public"."broadcast_messages_status_enum" RENAME TO "broadcast_status_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_status_enum') THEN
                CREATE TYPE "public"."broadcast_status_enum" AS ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" TYPE "public"."broadcast_status_enum" USING "status"::"text"::"public"."broadcast_status_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."broadcast_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_status_enum_old"`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_targetaudience_enum') THEN
                ALTER TYPE "public"."broadcast_messages_targetaudience_enum" RENAME TO "broadcast_audience_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_audience_enum') THEN
                CREATE TYPE "public"."broadcast_audience_enum" AS ENUM('ALL_TENANTS', 'TENANT_OWNERS', 'ALL_COACHES', 'ALL_CLIENTS', 'SPECIFIC_PLANS');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" TYPE "public"."broadcast_audience_enum" USING "targetAudience"::"text"::"public"."broadcast_audience_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "targetAudience" SET DEFAULT 'ALL_TENANTS'::"public"."broadcast_audience_enum"`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_audience_enum_old"`);

        await queryRunner.query(`DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_messages_type_enum') THEN
                ALTER TYPE "public"."broadcast_messages_type_enum" RENAME TO "broadcast_type_enum_old";
            END IF;
        END $$;`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_type_enum') THEN
                CREATE TYPE "public"."broadcast_type_enum" AS ENUM('EMAIL', 'SMS', 'IN_APP');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" TYPE "public"."broadcast_type_enum" USING "type"::"text"::"public"."broadcast_type_enum"`);
        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "type" SET DEFAULT 'EMAIL'::"public"."broadcast_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."broadcast_type_enum_old"`);

        await queryRunner.query(`ALTER TABLE "broadcast_messages" ALTER COLUMN "subject" TYPE character varying(255)`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "enabled_at" TYPE TIMESTAMP WITH TIME ZONE USING "enabled_at"::timestamptz, ALTER COLUMN "enabled_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "enabled" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_assignments" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upgrade_request_status_enum_old') THEN
                CREATE TYPE "public"."upgrade_request_status_enum_old" AS ENUM('pending', 'approved', 'rejected');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" TYPE "public"."upgrade_request_status_enum_old" USING "status"::"text"::"public"."upgrade_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."upgrade_request_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."plan_upgrade_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."upgrade_request_status_enum_old" RENAME TO "upgrade_request_status_enum"`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plan_upgrade_requests" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "owner_audit_logs" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::timestamptz, ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE USING "updatedAt"::timestamptz, ALTER COLUMN "updatedAt" SET DEFAULT now()`);

        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" TYPE character varying(50) USING "category"::"text"::"character varying"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "category" SET DEFAULT 'system'::character varying`);
        await queryRunner.query(`DROP TYPE "public"."system_settings_category_enum"`);

        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "description" TYPE text`);

        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT "PK_b1b5bc664526d375c94ce9ad43d"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "key" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "is_experimental" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "dependencies" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "default_enabled" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_flags" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "features" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "usage_metrics" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "packages" ALTER COLUMN "low_session_threshold" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "must_change_password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "is_blocked" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status_enum_old') THEN
                CREATE TYPE "public"."tenant_status_enum_old" AS ENUM('trial', 'active', 'suspended', 'blocked');
            END IF;
        END $$;`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "public"."tenant_status_enum_old" USING "status"::"text"::"public"."tenant_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."tenant_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tenant_status_enum_old" RENAME TO "tenant_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "trial_ends_at"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "auto_renew"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "subscription_ends_at"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "billing_cycle"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_billing_cycle_enum"`);
    }

}
