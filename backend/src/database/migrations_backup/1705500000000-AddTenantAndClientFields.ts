import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantAndClientFields1705500000000 implements MigrationInterface {
  name = 'AddTenantAndClientFields1705500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tenant fields if they don't exist
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'address') THEN
                    ALTER TABLE tenants ADD COLUMN address VARCHAR(255);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'phone') THEN
                    ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'city') THEN
                    ALTER TABLE tenants ADD COLUMN city VARCHAR(100);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'state') THEN
                    ALTER TABLE tenants ADD COLUMN state VARCHAR(100);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'zip_code') THEN
                    ALTER TABLE tenants ADD COLUMN zip_code VARCHAR(20);
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tenants' AND column_name = 'is_complete') THEN
                    ALTER TABLE tenants ADD COLUMN is_complete BOOLEAN DEFAULT false;
                END IF;
            END $$;
        `);

    // Add avatar_url to clients if it doesn't exist
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'clients' AND column_name = 'avatar_url') THEN
                    ALTER TABLE clients ADD COLUMN avatar_url TEXT;
                END IF;
            END $$;
        `);

    // Add tenant_owner role if it doesn't exist
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tenant_owner' 
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
                    ALTER TYPE user_role ADD VALUE 'tenant_owner' BEFORE 'admin';
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Removing enum values is complex in PostgreSQL, so we'll leave tenant_owner
    await queryRunner.query(
      `ALTER TABLE clients DROP COLUMN IF EXISTS avatar_url`,
    );
    await queryRunner.query(
      `ALTER TABLE tenants DROP COLUMN IF EXISTS is_complete`,
    );
    await queryRunner.query(
      `ALTER TABLE tenants DROP COLUMN IF EXISTS zip_code`,
    );
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS state`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS city`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS phone`);
    await queryRunner.query(
      `ALTER TABLE tenants DROP COLUMN IF EXISTS address`,
    );
  }
}
