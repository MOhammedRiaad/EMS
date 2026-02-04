import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(UserRoleAssignment)
        private readonly userRoleRepository: Repository<UserRoleAssignment>,
    ) { }

    /**
     * Get all roles (system and custom)
     */
    async getAllRoles(tenantId?: string): Promise<Role[]> {
        const queryBuilder = this.roleRepository.createQueryBuilder('role');

        // Include system roles (tenantId is null) and tenant-specific roles
        if (tenantId) {
            queryBuilder.where('role.tenantId IS NULL OR role.tenantId = :tenantId', { tenantId });
        } else {
            queryBuilder.where('role.tenantId IS NULL');
        }

        return queryBuilder
            .leftJoinAndSelect('role.permissions', 'permissions')
            .orderBy('role.isSystemRole', 'DESC')
            .addOrderBy('role.name', 'ASC')
            .getMany();
    }

    /**
     * Get role by ID
     */
    async getRoleById(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions'],
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        return role;
    }

    /**
     * Get role by key
     */
    async getRoleByKey(key: string): Promise<Role | null> {
        return this.roleRepository.findOne({
            where: { key },
            relations: ['permissions'],
        });
    }

    /**
     * Create a new role
     */
    async createRole(data: {
        key: string;
        name: string;
        description?: string;
        tenantId?: string;
        permissionKeys?: string[];
    }): Promise<Role> {
        // Check if key already exists
        const existing = await this.roleRepository.findOne({ where: { key: data.key } });
        if (existing) {
            throw new ConflictException(`Role with key "${data.key}" already exists`);
        }

        const role = this.roleRepository.create({
            key: data.key,
            name: data.name,
            description: data.description || null,
            tenantId: data.tenantId || null,
            isSystemRole: false,
        });

        // Assign permissions if provided
        if (data.permissionKeys && data.permissionKeys.length > 0) {
            const permissions = await this.permissionRepository.find({
                where: { key: In(data.permissionKeys) },
            });
            role.permissions = permissions;
        }

        return this.roleRepository.save(role);
    }

    /**
     * Update a role
     */
    async updateRole(
        id: string,
        data: {
            name?: string;
            description?: string;
            permissionKeys?: string[];
        },
    ): Promise<Role> {
        const role = await this.getRoleById(id);

        if (data.name) role.name = data.name;
        if (data.description !== undefined) role.description = data.description;

        if (data.permissionKeys) {
            const permissions = await this.permissionRepository.find({
                where: { key: In(data.permissionKeys) },
            });
            role.permissions = permissions;
        }

        return this.roleRepository.save(role);
    }

    /**
     * Delete a role (only non-system roles)
     */
    async deleteRole(id: string): Promise<void> {
        const role = await this.getRoleById(id);

        if (role.isSystemRole) {
            throw new ConflictException('Cannot delete system roles');
        }

        // Remove any user-role assignments first
        await this.userRoleRepository.delete({ roleId: id });
        await this.roleRepository.delete(id);
    }

    /**
     * Clone a role (useful for creating tenant-specific variations)
     */
    async cloneRole(sourceId: string, newKey: string, newName: string, tenantId?: string): Promise<Role> {
        const sourceRole = await this.getRoleById(sourceId);

        const newRole = this.roleRepository.create({
            key: newKey,
            name: newName,
            description: `Cloned from ${sourceRole.name}`,
            tenantId: tenantId || null,
            isSystemRole: false,
            permissions: sourceRole.permissions,
        });

        return this.roleRepository.save(newRole);
    }

    /**
     * Add permissions to a role
     */
    async addPermissionsToRole(roleId: string, permissionKeys: string[]): Promise<Role> {
        const role = await this.getRoleById(roleId);
        const newPermissions = await this.permissionRepository.find({
            where: { key: In(permissionKeys) },
        });

        const existingKeys = new Set(role.permissions.map((p) => p.key));
        for (const perm of newPermissions) {
            if (!existingKeys.has(perm.key)) {
                role.permissions.push(perm);
            }
        }

        return this.roleRepository.save(role);
    }

    /**
     * Remove permissions from a role
     */
    async removePermissionsFromRole(roleId: string, permissionKeys: string[]): Promise<Role> {
        const role = await this.getRoleById(roleId);
        role.permissions = role.permissions.filter((p) => !permissionKeys.includes(p.key));
        return this.roleRepository.save(role);
    }

    /**
     * Get all users with a specific role
     */
    async getUsersWithRole(roleId: string): Promise<UserRoleAssignment[]> {
        return this.userRoleRepository.find({
            where: { roleId },
            relations: ['user'],
        });
    }

    /**
     * Assign a role to a user
     */
    async assignRoleToUser(userId: string, roleId: string): Promise<UserRoleAssignment> {
        // Check if assignment already exists
        const existing = await this.userRoleRepository.findOne({
            where: { userId, roleId },
        });

        if (existing) {
            return existing;
        }

        const assignment = this.userRoleRepository.create({
            userId,
            roleId,
            assignedAt: new Date(),
        });

        return this.userRoleRepository.save(assignment);
    }
}
