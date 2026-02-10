import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleService } from './role.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let permissionRepo: jest.Mocked<Repository<Permission>>;
  let userRoleRepo: jest.Mocked<Repository<UserRoleAssignment>>;

  const mockPermission: Permission = {
    id: 'p1',
    key: 'perm.1',
    name: 'Permission 1',
  } as Permission;

  const mockRole: Role = {
    id: 'r1',
    key: 'role_1',
    name: 'Role 1',
    isSystemRole: false,
    permissions: [mockPermission],
  } as Role;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: {
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepo = module.get(getRepositoryToken(Role));
    permissionRepo = module.get(getRepositoryToken(Permission));
    userRoleRepo = module.get(getRepositoryToken(UserRoleAssignment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoleById', () => {
    it('should return role with permissions', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      const result = await service.getRoleById('r1');

      expect(result).toBe(mockRole);
      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'r1' },
        relations: ['permissions'],
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.getRoleById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRole', () => {
    const createDto = {
      key: 'new_role',
      name: 'New Role',
      permissionKeys: ['perm.1'],
    };

    it('should create a role and assign permissions by keys', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      roleRepo.create.mockReturnValue(mockRole);
      permissionRepo.find.mockResolvedValue([mockPermission]);
      roleRepo.save.mockResolvedValue({ ...mockRole, ...createDto });

      const result = await service.createRole(createDto);

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { key: 'new_role' },
      });
      expect(permissionRepo.find).toHaveBeenCalledWith({
        where: { key: In(['perm.1']) },
      });
      expect(roleRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Role');
    });

    it('should throw ConflictException if key already exists', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      await expect(service.createRole(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete non-system role after removing user assignments', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      await service.deleteRole('r1');

      expect(userRoleRepo.delete).toHaveBeenCalledWith({ roleId: 'r1' });
      expect(roleRepo.delete).toHaveBeenCalledWith('r1');
    });

    it('should throw ConflictException when trying to delete system role', async () => {
      const systemRole = { ...mockRole, isSystemRole: true };
      roleRepo.findOne.mockResolvedValue(systemRole);

      await expect(service.deleteRole('r-sys')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cloneRole', () => {
    it('should create a new role with same permissions as source', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      roleRepo.create.mockReturnValue({ ...mockRole, id: 'r-cloned' });
      roleRepo.save.mockImplementation(async (r) => r as Role);

      const result = await service.cloneRole('r1', 'cloned_key', 'Cloned Name');

      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'cloned_key',
          name: 'Cloned Name',
          permissions: mockRole.permissions,
        }),
      );
      expect(result.id).toBe('r-cloned');
    });
  });
});
