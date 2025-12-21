-- =============================================================================
-- EMS Studio - Database Initialization
-- =============================================================================
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'client');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE device_status AS ENUM ('available', 'in_use', 'maintenance');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================================================
-- TENANTS (Top-level business entities)
-- =============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    features JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STUDIOS (Physical locations)
-- =============================================================================
CREATE TABLE studios (
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

-- =============================================================================
-- ROOMS (Training spaces within studios)
-- =============================================================================
CREATE TABLE rooms (
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

-- =============================================================================
-- USERS (Authentication & identity)
-- =============================================================================
CREATE TABLE users (
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

-- =============================================================================
-- COACHES (Staff members who conduct sessions)
-- =============================================================================
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    bio TEXT,
    specializations TEXT[],
    availability_rules JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CLIENTS (Members who book sessions)
-- =============================================================================
CREATE TABLE clients (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- EMS DEVICES (Training equipment)
-- =============================================================================
CREATE TABLE ems_devices (
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

-- =============================================================================
-- SESSIONS (Training bookings)
-- =============================================================================
CREATE TABLE sessions (
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

-- =============================================================================
-- CLIENT SESSION REVIEWS (Feedback)
-- =============================================================================
CREATE TABLE client_session_reviews (
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

-- =============================================================================
-- INBODY RECORDS (Body composition tracking)
-- =============================================================================
CREATE TABLE inbody_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    metrics JSONB NOT NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS (Session credits & transactions)
-- =============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
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

-- =============================================================================
-- INDEXES (Performance optimization)
-- =============================================================================

-- Tenant-scoped queries
CREATE INDEX idx_studios_tenant ON studios(tenant_id);
CREATE INDEX idx_rooms_tenant ON rooms(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_coaches_tenant ON coaches(tenant_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);

-- Scheduling queries
CREATE INDEX idx_sessions_scheduling ON sessions(studio_id, start_time, end_time) WHERE status != 'cancelled';
CREATE INDEX idx_sessions_room ON sessions(room_id, start_time, end_time) WHERE status != 'cancelled';
CREATE INDEX idx_sessions_coach ON sessions(coach_id, start_time, end_time) WHERE status != 'cancelled';
CREATE INDEX idx_sessions_client ON sessions(client_id, start_time);
CREATE INDEX idx_sessions_device ON sessions(ems_device_id, start_time, end_time) WHERE status != 'cancelled' AND ems_device_id IS NOT NULL;

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;

-- Reviews
CREATE INDEX idx_reviews_coach ON client_session_reviews(coach_id, created_at);

-- =============================================================================
-- ROW-LEVEL SECURITY (Tenant isolation)
-- =============================================================================

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

-- =============================================================================
-- FUNCTIONS (Utility)
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA (Development only)
-- =============================================================================

-- Demo tenant
INSERT INTO tenants (id, name, slug, plan, features) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo Studio Group', 'demo', 'professional', '{"multi_room": true, "reviews": true, "inbody": true}');

-- Demo studio
INSERT INTO studios (id, tenant_id, name, slug, address, city, country, timezone, opening_hours) VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Downtown Studio', 'downtown', '123 Main Street', 'Berlin', 'Germany', 'Europe/Berlin', 
     '{"monday": {"open": "07:00", "close": "21:00"}, "tuesday": {"open": "07:00", "close": "21:00"}, "wednesday": {"open": "07:00", "close": "21:00"}, "thursday": {"open": "07:00", "close": "21:00"}, "friday": {"open": "07:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": null}');

-- Demo rooms
INSERT INTO rooms (tenant_id, studio_id, name, capacity) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Room A', 1),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Room B', 1),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Group Room', 4);

-- Demo admin user (password: admin123)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, email_verified) VALUES
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'admin@demo.ems', '$2b$10$8Ux8KlKEhL5HDHQqLKJsouQKqJKqJKqJKqJKqJKqJKqJKqJKqJKqJ', 'admin', 'Demo', 'Admin', true);

-- Demo EMS devices
INSERT INTO ems_devices (tenant_id, studio_id, label, serial_number, model, status) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'EMS-001', 'SN-2024-001', 'PowerSuit Pro', 'available'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'EMS-002', 'SN-2024-002', 'PowerSuit Pro', 'available'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'EMS-003', 'SN-2024-003', 'PowerSuit Pro', 'available');

-- Database initialization complete
-- Demo tenant, studio, rooms, and devices have been created
