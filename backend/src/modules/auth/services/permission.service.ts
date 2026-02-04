import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleRepository: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permissionKey: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some((p) => p.key === permissionKey);
  }

  /**
   * Check if a user has ALL of the specified permissions (AND logic)
   */
  async hasAllPermissions(
    userId: string,
    permissionKeys: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const userPermissionKeys = permissions.map((p) => p.key);
    return permissionKeys.every((key) => userPermissionKeys.includes(key));
  }

  /**
   * Check if a user has ANY of the specified permissions (OR logic)
   */
  async hasAnyPermission(
    userId: string,
    permissionKeys: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const userPermissionKeys = permissions.map((p) => p.key);
    return permissionKeys.some((key) => userPermissionKeys.includes(key));
  }

  /**
   * Get all permissions for a user (aggregated from all their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'role.permissions'],
    });

    const permissionsSet = new Set<string>();
    const permissions: Permission[] = [];

    for (const userRole of userRoles) {
      if (userRole.role && userRole.role.permissions) {
        for (const permission of userRole.role.permissions) {
          if (!permissionsSet.has(permission.id)) {
            permissionsSet.add(permission.id);
            permissions.push(permission);
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map((ur) => ur.role).filter(Boolean);
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<UserRoleAssignment> {
    // Check if already assigned
    const existing = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (existing) {
      return existing;
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      assignedBy: assignedBy || null,
    });

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Revoke a role from a user
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  /**
   * Create a new permission
   */
  async createPermission(data: {
    key: string;
    name: string;
    description?: string;
    category: string;
  }): Promise<Permission> {
    const permission = this.permissionRepository.create(data);
    return this.permissionRepository.save(permission);
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Get permissions by keys
   */
  async getPermissionsByKeys(keys: string[]): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { key: In(keys) },
    });
  }
}
