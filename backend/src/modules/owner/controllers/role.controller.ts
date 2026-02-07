import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from '../../auth/services/role.service';
import { PermissionService } from '../../auth/services/permission.service';
import {
  RequirePermissions,
  PermissionGuard,
} from '../guards/permission.guard';

@Controller('owner/roles')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) { }

  /**
   * Get all roles
   */
  @Get()
  @RequirePermissions('owner.role.view')
  async getAllRoles() {
    return this.roleService.getAllRoles();
  }

  /**
   * Get all permissions (for role builder)
   */
  @Get('permissions')
  @RequirePermissions('owner.role.view')
  async getAllPermissions() {
    return this.permissionService.getAllPermissions();
  }

  /**
   * Get role by ID
   */
  @Get(':id')
  @RequirePermissions('owner.role.view')
  async getRoleById(@Param('id') id: string) {
    return this.roleService.getRoleById(id);
  }

  /**
   * Create a new role
   */
  @Post()
  @RequirePermissions('owner.role.manage')
  async createRole(
    @Body()
    data: {
      key: string;
      name: string;
      description?: string;
      permissionKeys?: string[];
    },
  ) {
    return this.roleService.createRole(data);
  }

  /**
   * Update a role
   */
  @Patch(':id')
  @RequirePermissions('owner.role.manage')
  async updateRole(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      permissionKeys?: string[];
    },
  ) {
    return this.roleService.updateRole(id, data);
  }

  /**
   * Delete a role
   */
  @Delete(':id')
  @RequirePermissions('owner.role.manage')
  async deleteRole(@Param('id') id: string) {
    return this.roleService.deleteRole(id);
  }

  /**
   * Assign role to user
   */
  @Post(':roleId/users/:userId')
  @RequirePermissions('owner.role.assign')
  async assignRoleToUser(
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.permissionService.assignRoleToUser(userId, roleId);
  }

  /**
   * Revoke role from user
   */
  @Delete(':roleId/users/:userId')
  @RequirePermissions('owner.role.assign')
  async revokeRoleFromUser(
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.permissionService.revokeRoleFromUser(userId, roleId);
  }

  /**
   * Get user roles
   */
  @Get('users/:userId')
  @RequirePermissions('owner.role.view')
  async getUserRoles(@Param('userId') userId: string) {
    return this.permissionService.getUserRoles(userId);
  }

  /**
   * Create a new permission
   */
  @Post('permissions')
  @RequirePermissions('owner.role.manage')
  async createPermission(
    @Body()
    data: {
      key: string;
      name: string;
      description?: string;
      category: string;
    },
  ) {
    return this.permissionService.createPermission(data);
  }

  /**
   * Update a permission
   */
  @Patch('permissions/:id')
  @RequirePermissions('owner.role.manage')
  async updatePermission(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    return this.permissionService.updatePermission(id, data);
  }

  /**
   * Delete a permission
   */
  @Delete('permissions/:id')
  @RequirePermissions('owner.role.manage')
  async deletePermission(@Param('id') id: string) {
    return this.permissionService.deletePermission(id);
  }
}
