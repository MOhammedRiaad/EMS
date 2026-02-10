import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddOwnerTenantDeletePermission1770732000000 implements MigrationInterface {
  name = 'AddOwnerTenantDeletePermission1770732000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure the permission exists
    const newPermissionId = uuidv4();
    await queryRunner.query(
      `
            INSERT INTO permissions (id, key, name, description, category, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (key) DO NOTHING
        `,
      [
        newPermissionId,
        'owner.tenant.delete',
        'Delete Tenant',
        'Permanently delete a tenant and all their data',
        'owner',
      ],
    );

    // 2. Get the permission ID (whether new or existing)
    const permResult = await queryRunner.query(
      `SELECT id FROM permissions WHERE key = 'owner.tenant.delete'`,
    );

    if (permResult.length > 0) {
      const finalPermId = permResult[0].id;

      // 3. Assign to platform_owner role
      await queryRunner.query(
        `
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT id, $1 FROM roles WHERE key = 'platform_owner'
                ON CONFLICT DO NOTHING
            `,
        [finalPermId],
      );

      console.log(
        `Permission 'owner.tenant.delete' assigned to 'platform_owner'`,
      );
    } else {
      console.error(
        `Failed to find permission 'owner.tenant.delete' after insertion attempt.`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const permResult = await queryRunner.query(
      `SELECT id FROM permissions WHERE key = 'owner.tenant.delete'`,
    );
    if (permResult.length > 0) {
      const permId = permResult[0].id;
      // Remove the assignment
      await queryRunner.query(
        `DELETE FROM role_permissions WHERE permission_id = $1`,
        [permId],
      );
      // Remove the permission
      await queryRunner.query(`DELETE FROM permissions WHERE id = $1`, [
        permId,
      ]);
    }
  }
}
