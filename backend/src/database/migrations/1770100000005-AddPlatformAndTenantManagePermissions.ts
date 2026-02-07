import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformAndTenantManagePermissions1770100000005 implements MigrationInterface {
    name = 'AddPlatformAndTenantManagePermissions1770100000005';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insert missing permissions
        await queryRunner.query(`
            INSERT INTO permissions (key, name, description, category)
            VALUES 
                ('platform.settings.manage', 'Manage Platform Settings', 'Modify global platform configurations and defaults', 'owner'),
                ('owner.tenant.manage', 'Manage Tenants', 'Full control over tenant lifecycle and configuration', 'owner')
            ON CONFLICT (key) DO NOTHING;
        `);

        // 2. Get Platform Owner Role ID
        const platformOwnerRole = await queryRunner.query(`
            SELECT id FROM roles WHERE key = 'platform_owner';
        `);

        if (platformOwnerRole && platformOwnerRole.length > 0) {
            const roleId = platformOwnerRole[0].id;

            // 3. Get Permission IDs
            const permissions = await queryRunner.query(`
                SELECT id FROM permissions WHERE key IN ('platform.settings.manage', 'owner.tenant.manage');
            `);

            // 4. Assign permissions to Platform Owner
            for (const perm of permissions) {
                await queryRunner.query(
                    `
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING;
                `,
                    [roleId, perm.id],
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM permissions WHERE key IN ('platform.settings.manage', 'owner.tenant.manage');
        `);
    }
}
