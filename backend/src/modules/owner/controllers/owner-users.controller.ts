import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  PermissionGuard,
  RequirePermissions,
} from '../guards/permission.guard';
import { User } from '../../auth/entities/user.entity';
import { Repository, Like, In, Brackets } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ApiTags('Owner Users')
@Controller('owner/users') // Removed /api prefix to match other controllers if they don't have it, or kept it. RoleController has 'owner/roles'.
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class OwnerUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Search and list users for owner management' })
  @RequirePermissions('owner.role.manage')
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by role key',
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Only return users relevant to the platform context if needed,
    // but owner might want to see all.
    // For now, let's allow searching all users to find someone to promote to admin.

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email ILIKE :search', { search: `%${search}%` })
            .orWhere('user.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('user.lastName ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (role) {
      // Logic depends on how roles are stored.
      // If using the 'role' column (enum/string):
      queryBuilder.andWhere('user.role = :role', { role });

      // If using the many-to-many user_roles relation, we might need a join:
      // queryBuilder.innerJoin('user.roles', 'role', 'role.key = :roleKey', { roleKey: role });
    }

    // Select specific fields for security/privacy if needed, or return full object
    // excluding sensitive data handled by User entity @Exclude directives

    queryBuilder.skip(offset).take(limit).orderBy('user.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
    };
  }
}
