import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoachesService } from './coaches.service';
import { Coach } from './entities/coach.entity';
import { CoachTimeOffRequest } from './entities/coach-time-off.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('CoachesService', () => {
  let service: CoachesService;
  let repository: jest.Mocked<Repository<Coach>>;
  let authService: jest.Mocked<AuthService>;

  const mockCoach = {
    id: 'coach-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    studioId: 'studio-123',
    bio: 'Experienced coach',
    specializations: ['EMS', 'Fitness'],
    preferredClientGender: 'any',
    active: true,
    user: { id: 'user-123', firstName: 'Coach', lastName: 'Smith' },
    studio: { id: 'studio-123', name: 'Downtown Studio' },
  } as unknown as Coach;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachesService,
        {
          provide: getRepositoryToken(Coach),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockCoach]),
            })),
          },
        },
        {
          provide: AuthService,
          useValue: {
            findByEmail: jest.fn(),
            createClientUser: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CoachTimeOffRequest),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
            calculateDiff: jest.fn().mockReturnValue({ changes: {} }),
          },
        },
      ],
    }).compile();

    service = module.get<CoachesService>(CoachesService);
    repository = module.get(getRepositoryToken(Coach));
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all coaches for tenant', async () => {
      const result = await service.findAll('tenant-123');
      expect(result).toEqual([mockCoach]);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('coach');
    });

    it('should apply search filter', async () => {
      await service.findAll('tenant-123', 'Coach');
      expect(repository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findByStudio', () => {
    it('should return active coaches for specific studio', async () => {
      repository.find.mockResolvedValue([mockCoach]);

      const result = await service.findByStudio('studio-123', 'tenant-123');

      expect(result).toEqual([mockCoach]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { studioId: 'studio-123', tenantId: 'tenant-123', active: true },
        relations: ['user', 'studio'],
      });
    });
  });

  describe('findActive', () => {
    it('should return all active coaches', async () => {
      repository.find.mockResolvedValue([mockCoach]);

      const result = await service.findActive('tenant-123');

      expect(result).toEqual([mockCoach]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', active: true },
        relations: ['user', 'studio'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by client gender preference when provided', async () => {
      const malePreferringCoach = {
        ...mockCoach,
        preferredClientGender: 'male',
      } as unknown as Coach;
      const anyPreferringCoach = {
        ...mockCoach,
        id: 'coach-456',
        preferredClientGender: 'any',
      } as unknown as Coach;
      repository.find.mockResolvedValue([
        malePreferringCoach,
        anyPreferringCoach,
      ]);

      const result = await service.findActive('tenant-123', 'male');

      expect(result).toHaveLength(2);
    });

    it('should exclude coaches with mismatching gender preference', async () => {
      const femalePreferringCoach = {
        ...mockCoach,
        preferredClientGender: 'female',
      } as unknown as Coach;
      repository.find.mockResolvedValue([femalePreferringCoach]);

      const result = await service.findActive('tenant-123', 'male');

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return coach by id', async () => {
      repository.findOne.mockResolvedValue(mockCoach);

      const result = await service.findOne('coach-123', 'tenant-123');

      expect(result).toBe(mockCoach);
    });

    it('should throw NotFoundException if coach not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      userId: 'user-123',
      studioId: 'studio-123',
      bio: 'New coach',
    };

    it('should create a coach', async () => {
      repository.create.mockReturnValue(mockCoach);
      repository.save.mockResolvedValue(mockCoach);

      const result = await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-123',
      });
      expect(result).toBe(mockCoach);
    });
  });

  describe('createWithUser', () => {
    const createDto = {
      email: 'newcoach@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'Coach',
      studioId: 'studio-123',
      bio: 'Bio text',
    };

    it('should create coach with linked user account', async () => {
      authService.findByEmail.mockResolvedValue(null);
      authService.createClientUser.mockResolvedValue({ id: 'user-123' } as any);
      repository.create.mockReturnValue(mockCoach);
      repository.save.mockResolvedValue(mockCoach);

      const result = await service.createWithUser(createDto, 'tenant-123');

      expect(authService.createClientUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'coach' }),
        'tenant-123',
      );
      expect(result).toBe(mockCoach);
    });

    it('should throw error if email already exists', async () => {
      authService.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(
        service.createWithUser(createDto, 'tenant-123'),
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('update', () => {
    const updateDto = { bio: 'Updated bio' };

    it('should update coach', async () => {
      repository.findOne.mockResolvedValue(mockCoach);
      repository.save.mockResolvedValue({ ...mockCoach, ...updateDto });

      const result = await service.update('coach-123', updateDto, 'tenant-123');

      expect(result.bio).toBe('Updated bio');
    });
  });

  describe('remove', () => {
    it('should soft delete by setting active to false', async () => {
      repository.findOne.mockResolvedValue(mockCoach);
      repository.save.mockImplementation(async (c) => c as Coach);

      await service.remove('coach-123', 'tenant-123');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });
  });
});
