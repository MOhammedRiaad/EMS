import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let repository: jest.Mocked<Repository<Tenant>>;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    isComplete: false,
    address: null,
    phone: null,
    city: null,
    state: null,
    zipCode: null,
  } as Tenant;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    repository = module.get(getRepositoryToken(Tenant));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      repository.find.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(result).toEqual([mockTenant]);
    });
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      repository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-123');

      expect(result).toBe(mockTenant);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      repository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('test-tenant');

      expect(result).toBe(mockTenant);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
      });
    });

    it('should return null if not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('checkSlugAvailable', () => {
    it('should return true if slug is available', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.checkSlugAvailable('new-slug');

      expect(result).toBe(true);
    });

    it('should return false if slug is taken', async () => {
      repository.findOne.mockResolvedValue(mockTenant);

      const result = await service.checkSlugAvailable('test-tenant');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    const createDto = { name: 'New Tenant' };

    it('should create a tenant with generated slug', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockTenant);
      repository.save.mockResolvedValue(mockTenant);

      await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'New Tenant',
        slug: 'new-tenant',
        isComplete: false,
      });
    });

    it('should use provided slug if specified', async () => {
      const dtoWithSlug = { name: 'New Tenant', slug: 'custom-slug' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockTenant);
      repository.save.mockResolvedValue(mockTenant);

      await service.create(dtoWithSlug);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      repository.findOne.mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update tenant', async () => {
      repository.findOne.mockResolvedValue(mockTenant);
      repository.save.mockResolvedValue({
        ...mockTenant,
        name: 'Updated Name',
      });

      const result = await service.update('tenant-123', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should set isComplete when all required fields are filled', async () => {
      const incompleteTenant = { ...mockTenant, isComplete: false };
      repository.findOne.mockResolvedValue(incompleteTenant);
      repository.save.mockImplementation(async (t) => t as Tenant);

      await service.update('tenant-123', {
        address: '123 Main St',
        phone: '555-1234',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isComplete: true }),
      );
    });

    it('should merge branding settings', async () => {
      const tenantWithSettings = {
        ...mockTenant,
        settings: { existing: true },
      };
      repository.findOne.mockResolvedValue(tenantWithSettings);
      repository.save.mockImplementation(async (t) => t as Tenant);

      const brandingUpdate = {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#000000',
      };

      await service.update('tenant-123', {
        branding: brandingUpdate,
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            existing: true,
            branding: brandingUpdate,
          },
        }),
      );
    });
  });
});
