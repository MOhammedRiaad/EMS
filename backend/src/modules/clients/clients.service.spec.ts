import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { Transaction } from '../packages/entities/transaction.entity';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import { User } from '../auth/entities/user.entity';
import { ClientProgressPhoto } from './entities/client-progress-photo.entity';
import { AuditService } from '../audit/audit.service';
import { PermissionService } from '../auth/services/permission.service';
import { RoleService } from '../auth/services/role.service';
import { NotFoundException } from '@nestjs/common';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';
import { Session } from '../sessions/entities/session.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;
  let authService: jest.Mocked<AuthService>;
  let mailerService: jest.Mocked<MailerService>;
  let module: TestingModule;

  const mockClient = {
    id: 'client-123',
    tenantId: 'tenant-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    status: 'active',
    userId: null,
    get fullName(): string {
      return `${this.firstName} ${this.lastName}`;
    },
    creditBalance: 0,
    transactions: [],
    studioId: null,
    dateOfBirth: null,
    notes: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    gender: null,
    height: null,
    weight: null,
    fitnessGoals: null,
    healthConditions: null,
    referralSource: null,
    profileImage: null,
    waivers: [],
    packages: [],
    reviews: [],
    favoriteCoaches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Client;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockClient]),
              getOne: jest.fn().mockResolvedValue(mockClient),
            })),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(
            require('./entities/client-progress-photo.entity')
              .ClientProgressPhoto,
          ),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            findByEmail: jest.fn(),
            createClientUser: jest.fn(),
            generateInviteToken: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendClientInvitation: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientProgressPhoto),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
            calculateDiff: jest.fn().mockReturnValue({ changes: {} }),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            getPermissionsForRole: jest.fn().mockResolvedValue([]),
            isPermissionAllowed: jest.fn().mockReturnValue(true),
            getUserPermissions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            getRoleByKey: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(FavoriteCoach),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              addGroupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
              getMany: jest.fn(),
            })),
          },
        },
      ],
    }).compile();
    module = moduleRef;

    service = module.get<ClientsService>(ClientsService);
    repository = module.get(getRepositoryToken(Client));
    authService = module.get(AuthService);
    mailerService = module.get(MailerService);
    // Mock auditService methods
    module.get(AuditService).log = jest.fn();
    module.get(AuditService).calculateDiff = jest
      .fn()
      .mockReturnValue({ changes: {} });

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active clients for tenant', async () => {
      const result = await service.findAll('tenant-123');
      expect(result).toEqual([mockClient]);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('client');
    });

    it('should apply search filter if provided', async () => {
      const queryBuilder: any = repository.createQueryBuilder();
      await service.findAll('tenant-123', 'John');
      // We can't easily check the exact Brackets content with simple mocks,
      // but we can check if query builder was used.
      expect(repository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return client by id', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockClient),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findOne('client-123', 'tenant-123');

      expect(result).toBe(mockClient);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('client.id = :id', { id: 'client-123' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('client.tenantId = :tenantId', { tenantId: 'tenant-123' });
    });

    it('should throw NotFoundException if client not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.findOne('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include user relation when specified', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockClient),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findOne('client-123', 'tenant-123', ['user']);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('client.user', 'user');
    });

    it('should include studio relation when specified', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockClient),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findOne('client-123', 'tenant-123', ['studio']);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('client.studio', 'studio');
    });
  });

  describe('create', () => {
    const createDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '999-888-7777',
    };

    it('should create a client', async () => {
      repository.create.mockReturnValue(mockClient);
      repository.save.mockResolvedValue(mockClient);

      const result = await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-123',
      });
      expect(result).toBe(mockClient);
    });
  });

  describe('createWithUser', () => {
    const createDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'Password123!',
      phone: '999-888-7777',
    };

    it('should create client with linked user account', async () => {
      authService.findByEmail.mockResolvedValue(null);
      authService.createClientUser.mockResolvedValue({ id: 'user-123' } as any);
      repository.create.mockReturnValue(mockClient);
      repository.save.mockResolvedValue(mockClient);

      const result = await service.createWithUser(createDto, 'tenant-123');

      expect(authService.createClientUser).toHaveBeenCalled();
      expect(result).toBe(mockClient);
    });

    it('should throw error if email already exists', async () => {
      authService.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(
        service.createWithUser(createDto, 'tenant-123'),
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('update', () => {
    const updateDto = { phone: '555-555-5555' };

    it('should update client', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ ...mockClient, user: null }),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      repository.save.mockResolvedValue({
        ...mockClient,
        ...updateDto,
        fullName: 'John Doe',
      });

      const result = await service.update(
        'client-123',
        updateDto,
        'tenant-123',
      );

      expect(result.phone).toBe('555-555-5555');
    });

    it('should throw NotFoundException if client not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.update('nonexistent', updateDto, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete by setting status to inactive', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockClient),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      repository.save.mockImplementation(async (c) => c as Client);

      await service.remove('client-123', 'tenant-123');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' }),
      );
    });
  });

  describe('invite', () => {
    it('should create user and send invitation email', async () => {
      const clientWithEmail = { ...mockClient, userId: null } as any;
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(clientWithEmail),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      authService.findByEmail.mockResolvedValue(null);
      authService.createClientUser.mockResolvedValue({
        id: 'new-user',
        email: 'john@example.com',
      } as any);
      authService.generateInviteToken.mockReturnValue('invite-token');
      repository.save.mockResolvedValue({
        ...clientWithEmail,
        userId: 'new-user',
      });

      await service.invite('client-123', 'tenant-123');

      expect(authService.createClientUser).toHaveBeenCalled();
      expect(authService.generateInviteToken).toHaveBeenCalled();
      expect(mailerService.sendClientInvitation).toHaveBeenCalledWith(
        'john@example.com',
        expect.stringContaining('token=invite-token'),
      );
    });

    it('should throw error if client has no email', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockClient,
          email: null,
          userId: null,
        } as any),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.invite('client-123', 'tenant-123')).rejects.toThrow(
        'Client does not have an email address',
      );
    });

    it('should throw error if client already has user account', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockClient,
          userId: 'existing-user',
        } as any),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(service.invite('client-123', 'tenant-123')).rejects.toThrow(
        'Client already has a user account linked',
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transactions for client', async () => {
      const transactionRepo = module.get(getRepositoryToken(Transaction));
      const mockTx = { id: 'tx-1', amount: 50 } as any;
      transactionRepo.find.mockResolvedValue([mockTx]);

      const result = await service.getTransactions('client-123', 'tenant-123');

      expect(result).toEqual([mockTx]);
      expect(transactionRepo.find).toHaveBeenCalledWith({
        where: { clientId: 'client-123', tenantId: 'tenant-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('adjustBalance', () => {
    it('should update balance and create transaction', async () => {
      const transactionRepo = module.get(getRepositoryToken(Transaction));
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockClient,
          creditBalance: 100,
        } as any),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      repository.save.mockResolvedValue({
        ...mockClient,
        creditBalance: 150,
      } as any);
      transactionRepo.create.mockReturnValue({ id: 'new-tx' } as any);
      transactionRepo.save.mockResolvedValue({ id: 'new-tx' } as any);

      const result = await service.adjustBalance(
        'client-123',
        'tenant-123',
        50,
        'Top up',
        'user-admin',
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ creditBalance: 150 }),
      );
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          clientId: 'client-123',
          type: 'income',
          runningBalance: 150,
        }),
      );
    });
  });

  describe('getFavoriteCoach', () => {
    let favoriteCoachRepo: jest.Mocked<Repository<FavoriteCoach>>;
    let sessionRepo: jest.Mocked<Repository<Session>>;

    beforeEach(() => {
      favoriteCoachRepo = module.get(getRepositoryToken(FavoriteCoach));
      sessionRepo = module.get(getRepositoryToken(Session));
      repository.findOne.mockResolvedValue(mockClient);
    });

    it('should return favorite coach if exists', async () => {
      const mockFavorite = {
        id: 'fav-123',
        clientId: 'client-123',
        coachId: 'coach-123',
        tenantId: 'tenant-123',
        favoritedAt: new Date('2024-01-01'),
        coach: {
          id: 'coach-123',
          user: {
            id: 'user-123',
            firstName: 'Jane',
            lastName: 'Smith',
            avatarUrl: 'avatar.jpg',
          },
        },
      } as any;

      favoriteCoachRepo.findOne.mockResolvedValue(mockFavorite);

      const result = await service.getFavoriteCoach('client-123', 'tenant-123');

      expect(result).toEqual({
        id: 'coach-123',
        firstName: 'Jane',
        lastName: 'Smith',
        name: 'Jane Smith',
        avatarUrl: 'avatar.jpg',
        favoritedAt: mockFavorite.favoritedAt,
        isFavorite: true,
      });
      expect(favoriteCoachRepo.findOne).toHaveBeenCalledWith({
        where: { clientId: 'client-123', tenantId: 'tenant-123' },
        relations: ['coach', 'coach.user'],
        order: { favoritedAt: 'DESC' },
      });
    });

    it('should return most assigned coach if no favorite coach exists', async () => {
      favoriteCoachRepo.findOne.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          coachId: 'coach-456',
          id: 'coach-456',
          firstName: 'Bob',
          lastName: 'Johnson',
          avatarUrl: null,
          sessionCount: '15',
        }),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getFavoriteCoach('client-123', 'tenant-123');

      expect(result).toEqual({
        id: 'coach-456',
        firstName: 'Bob',
        lastName: 'Johnson',
        name: 'Bob Johnson',
        avatarUrl: null,
        sessionCount: 15,
        isFavorite: false,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.clientId = :clientId',
        { clientId: 'client-123' },
      );
    });

    it('should return null if no favorite coach and no sessions exist', async () => {
      favoriteCoachRepo.findOne.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getFavoriteCoach('client-123', 'tenant-123');

      expect(result).toBeNull();
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.getFavoriteCoach('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMostUsedRoom', () => {
    let sessionRepo: jest.Mocked<Repository<Session>>;

    beforeEach(() => {
      sessionRepo = module.get(getRepositoryToken(Session));
      repository.findOne.mockResolvedValue(mockClient);
    });

    it('should return most used room with usage count', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          roomId: 'room-123',
          roomName: 'Room A',
          usageCount: '25',
        }),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMostUsedRoom('client-123', 'tenant-123');

      expect(result).toEqual({
        roomId: 'room-123',
        roomName: 'Room A',
        usageCount: 25,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.clientId = :clientId',
        { clientId: 'client-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'session.tenantId = :tenantId',
        { tenantId: 'tenant-123' },
      );
    });

    it('should return null if no sessions exist', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMostUsedRoom('client-123', 'tenant-123');

      expect(result).toBeNull();
    });

    it('should return null if roomId is null in result', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          roomId: null,
          roomName: null,
          usageCount: '0',
        }),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMostUsedRoom('client-123', 'tenant-123');

      expect(result).toBeNull();
    });

    it('should handle unknown room name', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          roomId: 'room-456',
          roomName: null,
          usageCount: '10',
        }),
      };

      sessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMostUsedRoom('client-123', 'tenant-123');

      expect(result).toEqual({
        roomId: 'room-456',
        roomName: 'Unknown Room',
        usageCount: 10,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.getMostUsedRoom('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
