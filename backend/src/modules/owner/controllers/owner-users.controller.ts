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

    // Join tenant to get name
    queryBuilder.leftJoinAndSelect('user.tenant', 'tenant');

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email ILIKE :search', { search: `%${search}%` })
            .orWhere('user.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('tenant.name ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    } else {
      // Default: Only show owners and tenant owners
      queryBuilder.andWhere('user.role IN (:...roles)', {
        roles: ['owner', 'tenant_owner'],
      });
    }

    queryBuilder.select([
      'user.id',
      'user.email',
      'user.firstName',
      'user.lastName',
      'user.role',
      'user.createdAt',
      'user.lastLoginAt',
      'tenant.id',
      'tenant.name',
    ]);

    queryBuilder.skip(offset).take(limit).orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    // Flatten result for easier frontend consumption if needed, or just return as is
    const items = users.map(user => ({
      ...user,
      tenantName: user.tenant?.name || 'N/A'
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  }
}
