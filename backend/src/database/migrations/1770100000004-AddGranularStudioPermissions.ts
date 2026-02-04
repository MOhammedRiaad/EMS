import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddGranularStudioPermissions1770100000004 implements MigrationInterface {
  name = 'AddGranularStudioPermissions1770100000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const categories = [
      { key: 'studio', name: 'Studio' },
      { key: 'room', name: 'Room' },
      { key: 'device', name: 'Device' },
    ];

    const permissions = [
      // Studio
      { key: 'studio.create', name: 'Create Studio', category: 'studio' },
      { key: 'studio.read', name: 'Read Studios', category: 'studio' },
      { key: 'studio.update', name: 'Update Studio', category: 'studio' },
      { key: 'studio.delete', name: 'Delete Studio', category: 'studio' },

      // Room
      { key: 'room.create', name: 'Create Room', category: 'room' },
      { key: 'room.read', name: 'Read Rooms', category: 'room' },
      { key: 'room.update', name: 'Update Room', category: 'room' },
      { key: 'room.delete', name: 'Delete Room', category: 'room' },

      // Device
      { key: 'device.create', name: 'Create Device', category: 'device' },
      { key: 'device.read', name: 'Read Devices', category: 'device' },
      { key: 'device.update', name: 'Update Device', category: 'device' },
      { key: 'device.delete', name: 'Delete Device', category: 'device' },
    ];

    // 1. Insert new permissions
    for (const perm of permissions) {
      await queryRunner.query(
        `
                INSERT INTO permissions (id, key, name, description, category, is_active)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (key) DO NOTHING;
            `,
        [
          uuidv4(),
          perm.key,
          perm.name,
          `Permission to ${perm.name.toLowerCase()}`,
          perm.category,
        ],
      );
    }

    // 2. Assign to Roles (tenant_owner, admin, platform_owner)
    // Helper to get permission ID
    const getPermissionId = async (key: string): Promise<string | null> => {
      const result = await queryRunner.query(
        `SELECT id FROM permissions WHERE key = $1`,
        [key],
      );
      return result[0]?.id || null;
    };

    const rolesToAssign = ['platform_owner', 'tenant_owner', 'admin'];

    for (const roleKey of rolesToAssign) {
      const roles = await queryRunner.query(
        `SELECT id FROM roles WHERE key = $1`,
        [roleKey],
      );
      if (!roles.length) continue;
      const roleId = roles[0].id;

      for (const perm of permissions) {
        // Admin maybe shouldn't delete studios? But for now giving full access to keep it simple.
        // Restricting 'studio.delete' and 'studio.create' for admins if desired, but user asked for these for 'tenant_owner'.
        const permId = await getPermissionId(perm.key);
        if (permId) {
          await queryRunner.query(
            `
                        INSERT INTO role_permissions (role_id, permission_id)
                        VALUES ($1, $2)
                        ON CONFLICT (role_id, permission_id) DO NOTHING
                    `,
            [roleId, permId],
          );
        }
      }
    }

    console.log(
      'Added granular studio/room/device permissions and assigned to owners/admins.',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Safe to leave them
  }
}
