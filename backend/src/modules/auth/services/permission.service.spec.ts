import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from './permission.service';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';

describe('PermissionService', () => {
    let service: PermissionService;
    let permissionRepo: jest.Mocked<Repository<Permission>>;
    let roleRepo: jest.Mocked<Repository<Role>>;
    let userRoleRepo: jest.Mocked<Repository<UserRoleAssignment>>;

    const mockPermission: Permission = {
        id: 'perm-1',
        key: 'test.permission',
        name: 'Test Permission',
        category: 'test',
        isActive: true,
    } as Permission;

    const mockRole: Role = {
        id: 'role-1',
        key: 'test_role',
        name: 'Test Role',
        permissions: [mockPermission],
    } as Role;

    const mockUserRole: UserRoleAssignment = {
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
        role: mockRole,
    } as UserRoleAssignment;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionService,
                {
                    provide: getRepositoryToken(Permission),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Role),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserRoleAssignment),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PermissionService>(PermissionService);
        permissionRepo = module.get(getRepositoryToken(Permission));
        roleRepo = module.get(getRepositoryToken(Role));
        userRoleRepo = module.get(getRepositoryToken(UserRoleAssignment));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserPermissions', () => {
        it('should aggregate permissions from all user roles', async () => {
            userRoleRepo.find.mockResolvedValue([mockUserRole]);

            const result = await service.getUserPermissions('user-1');

            expect(result).toHaveLength(1);
            expect(result[0].key).toBe('test.permission');
            expect(userRoleRepo.find).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                relations: ['role', 'role.permissions'],
            });
        });

        it('should handle users with no roles', async () => {
            userRoleRepo.find.mockResolvedValue([]);

            const result = await service.getUserPermissions('user-2');

            expect(result).toHaveLength(0);
        });

        it('should avoid duplicate permissions from different roles', async () => {
            const role2: Role = {
                id: 'role-2',
                key: 'role_2',
                permissions: [mockPermission],
            } as Role;
            const assignment2 = { role: role2 } as UserRoleAssignment;

            userRoleRepo.find.mockResolvedValue([mockUserRole, assignment2]);

            const result = await service.getUserPermissions('user-1');

            expect(result).toHaveLength(1);
        });
    });

    describe('hasPermission', () => {
        it('should return true if user has the permission', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([mockPermission]);

            const result = await service.hasPermission('user-1', 'test.permission');

            expect(result).toBe(true);
        });

        it('should return false if user does not have the permission', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([]);

            const result = await service.hasPermission('user-1', 'other.permission');

            expect(result).toBe(false);
        });
    });

    describe('hasAllPermissions', () => {
        it('should return true if user has all required permissions', async () => {
            const perm2 = { key: 'perm.2' } as Permission;
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([mockPermission, perm2]);

            const result = await service.hasAllPermissions('user-1', ['test.permission', 'perm.2']);

            expect(result).toBe(true);
        });

        it('should return false if any permission is missing', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([mockPermission]);

            const result = await service.hasAllPermissions('user-1', ['test.permission', 'missing.perm']);

            expect(result).toBe(false);
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true if user has at least one of the permissions', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([mockPermission]);

            const result = await service.hasAnyPermission('user-1', ['non-existent', 'test.permission']);

            expect(result).toBe(true);
        });

        it('should return false if user has none of the permissions', async () => {
            jest.spyOn(service, 'getUserPermissions').mockResolvedValue([]);

            const result = await service.hasAnyPermission('user-1', ['p1', 'p2']);

            expect(result).toBe(false);
        });
    });

    describe('assignRoleToUser', () => {
        it('should create and save a new assignment if not exists', async () => {
            userRoleRepo.findOne.mockResolvedValue(null);
            userRoleRepo.create.mockReturnValue(mockUserRole);
            userRoleRepo.save.mockResolvedValue(mockUserRole);

            const result = await service.assignRoleToUser('user-1', 'role-1', 'admin-1');

            expect(userRoleRepo.create).toHaveBeenCalledWith({
                userId: 'user-1',
                roleId: 'role-1',
                assignedBy: 'admin-1',
            });
            expect(result).toBe(mockUserRole);
        });

        it('should return existing assignment if already assigned', async () => {
            userRoleRepo.findOne.mockResolvedValue(mockUserRole);

            const result = await service.assignRoleToUser('user-1', 'role-1');

            expect(userRoleRepo.create).not.toHaveBeenCalled();
            expect(result).toBe(mockUserRole);
        });
    });

    describe('revokeRoleFromUser', () => {
        it('should delete the assignment', async () => {
            await service.revokeRoleFromUser('user-1', 'role-1');
            expect(userRoleRepo.delete).toHaveBeenCalledWith({ userId: 'user-1', roleId: 'role-1' });
        });
    });
});
