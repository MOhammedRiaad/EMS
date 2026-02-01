import { MigrationInterface, QueryRunner } from "typeorm";

export class BaseSchema1000000000000 implements MigrationInterface {
    name = 'BaseSchema1000000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('tenant_owner', 'admin', 'coach', 'client');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE device_status AS ENUM ('available', 'in_use', 'maintenance');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            CREATE TABLE IF NOT EXISTS tenants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                address VARCHAR(255),
                phone VARCHAR(50),
                city VARCHAR(100),
                state VARCHAR(100),
                zip_code VARCHAR(20),
                is_complete BOOLEAN DEFAULT false,
                plan VARCHAR(50) DEFAULT 'starter',
                features JSONB DEFAULT '{}',
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS studios (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
                opening_hours JSONB DEFAULT '{}',
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, slug)
            );

            CREATE TABLE IF NOT EXISTS rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                capacity INT DEFAULT 1 CHECK (capacity > 0),
                description TEXT,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(studio_id, name)
            );

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role user_role NOT NULL DEFAULT 'client',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(50),
                avatar_url TEXT,
                email_verified BOOLEAN DEFAULT false,
                active BOOLEAN DEFAULT true,
                last_login_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, email)
            );

            CREATE TABLE IF NOT EXISTS coaches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
                bio TEXT,
                specializations TEXT [],
                availability_rules JSONB DEFAULT '[]',
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS clients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                date_of_birth DATE,
                status client_status DEFAULT 'active',
                consent_flags JSONB DEFAULT '{"marketing": false, "data_processing": true}',
                health_notes TEXT,
                notes TEXT,
                avatar_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS ems_devices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
                label VARCHAR(100) NOT NULL,
                serial_number VARCHAR(100),
                model VARCHAR(100),
                status device_status DEFAULT 'available',
                last_maintenance_date DATE,
                next_maintenance_date DATE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(studio_id, label)
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
                room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
                coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
                client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
                ems_device_id UUID REFERENCES ems_devices(id) ON DELETE SET NULL,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                program_type VARCHAR(100),
                intensity_level INT CHECK (intensity_level BETWEEN 1 AND 10),
                status session_status DEFAULT 'scheduled',
                notes TEXT,
                cancelled_at TIMESTAMP WITH TIME ZONE,
                cancelled_reason TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT valid_time_range CHECK (end_time > start_time)
            );

            CREATE TABLE IF NOT EXISTS client_session_reviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                visible_to_admins BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS inbody_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                recorded_date DATE NOT NULL,
                metrics JSONB NOT NULL,
                file_url TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'EUR',
                package_type VARCHAR(50),
                sessions_purchased INT DEFAULT 1,
                sessions_remaining INT DEFAULT 1,
                payment_method VARCHAR(50),
                external_reference VARCHAR(255),
                status payment_status DEFAULT 'completed',
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_studios_tenant ON studios(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON rooms(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_coaches_tenant ON coaches(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);

            CREATE INDEX IF NOT EXISTS idx_sessions_scheduling ON sessions(studio_id, start_time, end_time) WHERE status != 'cancelled';
            CREATE INDEX IF NOT EXISTS idx_sessions_room ON sessions(room_id, start_time, end_time) WHERE status != 'cancelled';
            CREATE INDEX IF NOT EXISTS idx_sessions_coach ON sessions(coach_id, start_time, end_time) WHERE status != 'cancelled';
            CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id, start_time);
            CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(ems_device_id, start_time, end_time) WHERE status != 'cancelled' AND ems_device_id IS NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_reviews_coach ON client_session_reviews(coach_id, created_at);

            ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
            ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
            ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
            ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
            ALTER TABLE ems_devices ENABLE ROW LEVEL SECURITY;
            ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE client_session_reviews ENABLE ROW LEVEL SECURITY;
            ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;
            ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order of dependency
        await queryRunner.query(`DROP TABLE IF EXISTS payments CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS inbody_records CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS client_session_reviews CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS sessions CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS ems_devices CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS clients CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS coaches CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS rooms CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS studios CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS tenants CASCADE`);

        // Drop types
        await queryRunner.query(`DROP TYPE IF EXISTS payment_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS client_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS device_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS session_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    }
}
