import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class SeedPortalOwner1770731935253 implements MigrationInterface {
    name = 'SeedPortalOwner1770731935253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 0. Update the Enum in DB if needed (Postgres specific)
        try {
            await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'platform_owner'`);
            await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'owner'`);
        } catch (e) {
            console.log('Enum update skipped or failed (might already exist):', e.message);
        }

        // 1. Get or Create a Platform/System Tenant
        const tenants = await queryRunner.query(`SELECT id FROM tenants LIMIT 1`);
        if (tenants.length === 0) {
            console.error('No tenants found. Seeding aborted.');
            return;
        }
        const tenantId = tenants[0].id;

        // 2. Find the platform_owner role
        const roles = await queryRunner.query(`SELECT id FROM roles WHERE key = 'platform_owner'`);
        if (roles.length === 0) {
            console.error('Platform Owner role not found. Seeding aborted.');
            return;
        }
        const roleId = roles[0].id;

        // 3. Create or Update the user
        const email = 'owner@ems-studio.com';
        const password = 'PlatformOwner123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUsers = await queryRunner.query(`SELECT id FROM users WHERE email = $1`, [email]);
        let userId: string;

        if (existingUsers.length === 0) {
            userId = uuidv4();
            await queryRunner.query(`
                INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, active, email_verified, gender, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [userId, tenantId, email, hashedPassword, 'Global', 'Platform Owner', true, true, 'other', 'owner']);
            console.log(`User ${email} created with role 'owner'.`);
        } else {
            userId = existingUsers[0].id;
            await queryRunner.query(`UPDATE users SET role = 'owner', password_hash = $1 WHERE id = $2`, [hashedPassword, userId]);
            console.log(`User ${email} updated to role 'owner'.`);
        }

        // 4. Assign the role (RBAC)
        const assignments = await queryRunner.query(
            `SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`,
            [userId, roleId]
        );

        if (assignments.length === 0) {
            await queryRunner.query(`
                INSERT INTO user_roles (id, user_id, role_id)
                VALUES ($1, $2, $3)
            `, [uuidv4(), userId, roleId]);
            console.log(`Role 'platform_owner' assigned to ${email}.`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We generally don't delete owners in down migrations for safety, 
        // but we could remove the association if needed.
        const email = 'owner@ems-studio.com';
        const existingUsers = await queryRunner.query(`SELECT id FROM users WHERE email = $1`, [email],);
        if (existingUsers.length > 0) {
            const userId = existingUsers[0].id;
            await queryRunner.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
            // Not deleting the user itself to avoid accidental data loss if sessions were created.
            await queryRunner.query(`UPDATE users SET active = false WHERE id = $1`, [userId]);
        }
    }
}
