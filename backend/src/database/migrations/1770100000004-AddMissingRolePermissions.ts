import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingRolePermissions1770100000004 implements MigrationInterface {
  name = 'AddMissingRolePermissions1770100000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insert missing permissions
    await queryRunner.query(`
            INSERT INTO permissions (key, name, description, category)
            VALUES 
                ('owner.role.view', 'View Roles', 'View all roles and permissions', 'roles'),
                ('owner.role.assign', 'Assign Roles', 'Assign roles to users', 'roles')
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
                SELECT id FROM permissions WHERE key IN ('owner.role.view', 'owner.role.assign');
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
    // Revert assignments (cascade delete will handle it if we delete permission, but good to be explicit?)
    // Actually, deleting permission cascades to role_permissions usually.

    await queryRunner.query(`
            DELETE FROM permissions WHERE key IN ('owner.role.view', 'owner.role.assign');
        `);
  }
}
