import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { TenantsService } from '../tenants/tenants.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { SystemConfigService } from '../owner/services/system-config.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { UsageTrackingService } from '../owner/services/usage-tracking.service';
import {
  RegisterTenantOwnerDto,
  LoginDto,
  CreateUserDto,
  SetupPasswordDto,
} from './dto';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,...'),
}));

jest.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('mock-secret'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/EMS...'),
    verify: jest.fn().mockReturnValue(true),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let tenantsService: TenantsService;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    isComplete: false,
  };

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    active: true,
    emailVerified: false,
    lastLoginAt: null,
    client: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    passwordResetToken: null,
    passwordResetExpires: null,
  } as User;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockTenantsService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMailerService = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordReset: jest.fn(),
    sendTeamInvitation: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockFeatureFlagService = {
    getFeaturesForTenant: jest.fn().mockResolvedValue([
      { feature: { key: 'client.portal' }, enabled: true },
      { feature: { key: 'coach.portal' }, enabled: true },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: FeatureFlagService,
          useValue: mockFeatureFlagService,
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
          provide: UsageTrackingService,
          useValue: {
            recordMetric: jest.fn().mockResolvedValue(undefined),
            checkLimit: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: SystemConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    tenantsService = module.get<TenantsService>(TenantsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterTenantOwnerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      businessName: 'New Business',
    };

    it('should successfully register a new tenant owner', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantsService.create.mockResolvedValue(mockTenant);
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockTenantsService.create).toHaveBeenCalledWith({
        name: registerDto.businessName,
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create user with role tenant_owner', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantsService.create.mockResolvedValue(mockTenant);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const createSpy = jest.spyOn(mockUserRepository, 'create');
      mockUserRepository.create.mockReturnValue(mockUser);

      await service.register(registerDto);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'tenant_owner' }),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = (await service.login({
        ...loginDto,
        tenantId: 'tenant-123',
      })) as any;

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update lastLoginAt on successful login', async () => {
      const saveSpy = jest.spyOn(mockUserRepository, 'save');
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('mock-token');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login({ ...loginDto, tenantId: 'tenant-123' });

      expect(saveSpy).toHaveBeenCalled();
      const savedUser = saveSpy.mock.calls[0][0];
      expect(savedUser.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should handle login without tenantId for unique email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No user with tenantId
      mockUserRepository.find.mockResolvedValue([mockUser]);
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('mock-token');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = (await service.login(loginDto)) as any;

      expect(result).toHaveProperty('accessToken');
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        relations: ['client'],
      });
    });

    it('should throw UnauthorizedException for ambiguous email without tenantId', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No user with tenantId
      mockUserRepository.find.mockResolvedValue([
        mockUser,
        { ...mockUser, id: 'user-456' },
      ]);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should increment failed attempts on invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const saveSpy = jest.spyOn(mockUserRepository, 'save');

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(saveSpy).toHaveBeenCalled();
      const savedUser = saveSpy.mock.calls[0][0];
      expect(savedUser.failedLoginAttempts).toBe(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      const userNearLockout = { ...mockUser, failedLoginAttempts: 4 };
      mockUserRepository.findOne.mockResolvedValue(userNearLockout);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const saveSpy = jest.spyOn(mockUserRepository, 'save');

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow(UnauthorizedException);

      const savedUser = saveSpy.mock.calls[0][0];
      expect(savedUser.lockoutUntil).toBeInstanceOf(Date);
    });

    it('should block login if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockoutUntil: new Date(Date.now() + 10000), // Locked in future
      };
      mockUserRepository.findOne.mockResolvedValue(lockedUser);

      await expect(
        service.login({ ...loginDto, tenantId: 'tenant-123' }),
      ).rejects.toThrow('Account locked');
    });

    it('should require 2FA if enabled', async () => {
      const user2FA = { ...mockUser, isTwoFactorEnabled: true };
      mockUserRepository.findOne.mockResolvedValue(user2FA);
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        ...loginDto,
        tenantId: 'tenant-123',
      });

      // Using type assertion or checking properties directly as return type is union
      expect(result).toHaveProperty('requiresTwoFactor', true);
      expect(result).toHaveProperty('userId', user2FA.id);
      expect(result).not.toHaveProperty('accessToken');
    });
  });

  describe('createUser', () => {
    const createDto: CreateUserDto = {
      email: 'newcoach@example.com',
      password: 'Password123!',
      firstName: 'Coach',
      lastName: 'Person',
      role: 'coach',
    };

    const adminUser = { ...mockUser, role: 'admin' } as User;

    it('should allow admin to create user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(createDto, adminUser);

      expect(result).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should allow tenant_owner to create user', async () => {
      const ownerUser = { ...mockUser, role: 'tenant_owner' } as User;
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(createDto, ownerUser);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if non-admin tries to create user', async () => {
      const clientUser = { ...mockUser, role: 'client' } as User;

      await expect(service.createUser(createDto, clientUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if coach tries to create user', async () => {
      const coachUser = { ...mockUser, role: 'coach' } as User;

      await expect(service.createUser(createDto, coachUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createClientUser', () => {
    const createDto: CreateUserDto = {
      email: 'client@example.com',
      password: 'Password123!',
      firstName: 'Client',
      lastName: 'User',
      role: 'client',
    };

    it('should create user without permission checks', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.createClientUser(createDto, 'tenant-123');

      expect(result).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if email exists in tenant', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.createClientUser(createDto, 'tenant-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens', () => {
    it('should generate JWT token with correct payload', async () => {
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service['generateTokens'](mockUser, mockTenant);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockUser.tenantId,
          email: mockUser.email,
          role: mockUser.role,
        }),
      );
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw ForbiddenException if client portal is disabled for client', async () => {
      mockFeatureFlagService.getFeaturesForTenant.mockResolvedValueOnce([
        { feature: { key: 'client.portal' }, enabled: false },
      ]);
      const clientUser = { ...mockUser, role: 'client' } as User;

      await expect(
        service['generateTokens'](clientUser, mockTenant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if coach portal is disabled for coach', async () => {
      mockFeatureFlagService.getFeaturesForTenant.mockResolvedValueOnce([
        { feature: { key: 'coach.portal' }, enabled: false },
      ]);
      const coachUser = { ...mockUser, role: 'coach' } as User;

      await expect(
        service['generateTokens'](coachUser, mockTenant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include clientId in payload if user has client', async () => {
      const userWithClient = {
        ...mockUser,
        client: { id: 'client-123' },
      } as User;
      mockJwtService.sign.mockReturnValue('mock-token');

      await service['generateTokens'](userWithClient, mockTenant);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-123',
        }),
      );
    });

    it('should return user data without password', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service['generateTokens'](mockUser, mockTenant);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('role');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email and tenantId', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(
        'test@example.com',
        'tenant-123',
      );

      expect(result).toBe(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', tenantId: 'tenant-123' },
        relations: ['client'],
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(
        'nonexistent@example.com',
        'tenant-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('validateUser', () => {
    it('should validate and return active user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123', 'tenant-123');

      expect(result).toBe(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', tenantId: 'tenant-123', active: true },
        relations: ['client'],
      });
    });

    it('should return null for inactive user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('user-123', 'tenant-123');

      expect(result).toBeNull();
    });
  });

  describe('setupPassword', () => {
    const setupDto: SetupPasswordDto = {
      token: 'valid-invite-token',
      password: 'NewPassword123!',
    };

    it('should setup password with valid invite token', async () => {
      const tokenPayload = {
        sub: 'user-123',
        tenantId: 'tenant-123',
        type: 'invite',
      };

      mockJwtService.verify.mockReturnValue(tokenPayload);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        active: true,
      });
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.setupPassword(setupDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.setupPassword(setupDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with non-invite token type', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        tenantId: 'tenant-123',
        type: 'access',
      });

      await expect(service.setupPassword(setupDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should mark user as email verified and active', async () => {
      const tokenPayload = {
        sub: 'user-123',
        tenantId: 'tenant-123',
        type: 'invite',
      };

      mockJwtService.verify.mockReturnValue(tokenPayload);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        active: false,
      });
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('token');

      const saveSpy = jest.spyOn(mockUserRepository, 'save');

      await service.setupPassword(setupDto);

      const savedUser = saveSpy.mock.calls[0][0];
      expect(savedUser.emailVerified).toBe(true);
      expect(savedUser.active).toBe(true);
    });
  });

  describe('generateInviteToken', () => {
    it('should generate invite token with 7 day expiry', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
      };

      mockJwtService.sign.mockReturnValue('invite-token');

      const result = service.generateInviteToken(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
          tenantId: user.tenantId,
          type: 'invite',
        }),
        { expiresIn: '7d' },
      );
      expect(result).toBe('invite-token');
    });
  });

  describe('findAllByTenant', () => {
    const users = [
      { ...mockUser, id: 'user-1' },
      { ...mockUser, id: 'user-2', role: 'coach' },
    ] as User[];

    it('should return all users for tenant without password', async () => {
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAllByTenant('tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[0]).toHaveProperty('email');
    });

    it('should filter by role when provided', async () => {
      mockUserRepository.find.mockResolvedValue([users[1]]);

      const result = await service.findAllByTenant('tenant-123', 'coach');

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', role: 'coach' },
        order: { lastName: 'ASC', firstName: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should order results by last name then first name', async () => {
      mockUserRepository.find.mockResolvedValue(users);

      await service.findAllByTenant('tenant-123');

      expect(mockUserRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { lastName: 'ASC', firstName: 'ASC' },
        }),
      );
    });
  });

  describe('2FA Flows', () => {
    it('should generate 2FA secret and QR code', async () => {
      const result = await service.generateTwoFactorSecret(mockUser);
      expect(result).toHaveProperty('secret', 'mock-secret');
      expect(result).toHaveProperty('qrCode');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should enable 2FA with valid token', async () => {
      const userWithSecret = { ...mockUser, twoFactorSecret: 'secret' } as User;
      mockQueryBuilder.getOne.mockResolvedValue(userWithSecret);
      const result = await service.enableTwoFactor(
        userWithSecret,
        'valid-token',
      );

      expect(result).toHaveProperty('message');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isTwoFactorEnabled: true }),
      );
    });

    it('should verify 2FA login and return tokens', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: 'secret',
      } as User;
      mockQueryBuilder.getOne.mockResolvedValue(userWith2FA);
      mockTenantsService.findOne.mockResolvedValue(mockTenant);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.verifyTwoFactorLogin(
        userWith2FA.id,
        'valid-token',
      );
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('Password Reset', () => {
    it('should generate reset token for valid email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(mockUser.email);

      expect(result).toHaveProperty('message');
      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.passwordResetToken).toBeDefined();
    });

    it('should reset password with valid token', async () => {
      const userReset = {
        ...mockUser,
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 3600),
      } as User;
      mockUserRepository.findOne.mockResolvedValue(userReset);

      const result = await service.resetPassword(
        mockUser.email,
        'valid-token',
        'newPass',
      );
      expect(result).toHaveProperty('message');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
