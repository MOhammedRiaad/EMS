import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTenantOwnerPermissions1770100000003 implements MigrationInterface {
  name = 'FixTenantOwnerPermissions1770100000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Get the tenant_owner role ID
    const roles = await queryRunner.query(
      `SELECT id FROM roles WHERE key = 'tenant_owner'`,
    );
    if (!roles.length) {
      console.warn('Tenant Owner role not found, skipping permission fix.');
      return;
    }
    const roleId = roles[0].id;

    // 2. Define the permissions categories that Tenant Owner MUST have
    // Adding explicit categories and individual keys to be safe
    const categories = [
      'tenant',
      'client',
      'session',
      'coach',
      'package',
      'marketing',
      'communication',
      'finance',
      'compliance',
    ];

    // 3. Find all permissions matching these categories
    const permissions = await queryRunner.query(
      `
            SELECT id, key FROM permissions 
            WHERE category = ANY($1)
        `,
      [categories],
    );

    // 4. Assign permissions to the role
    for (const perm of permissions) {
      await queryRunner.query(
        `
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT (role_id, permission_id) DO NOTHING
            `,
        [roleId, perm.id],
      );
    }

    console.log(`Ensured ${permissions.length} permissions for tenant_owner.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No strict revert needed as this fixes missing data,
    // but removing them might break things if we rollback.
    // Leaving empty/safe.
  }
}
