import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudiosService } from './studios.service';
import { Studio } from './entities/studio.entity';
import { NotFoundException } from '@nestjs/common';

describe('StudiosService', () => {
  let service: StudiosService;
  let repository: jest.Mocked<Repository<Studio>>;

  const mockStudio = {
    id: 'studio-123',
    tenantId: 'tenant-123',
    name: 'Downtown Studio',
    slug: 'downtown-studio',
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    active: true,
    rooms: [],
  } as Studio;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudiosService,
        {
          provide: getRepositoryToken(Studio),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StudiosService>(StudiosService);
    repository = module.get(getRepositoryToken(Studio));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all studios for tenant', async () => {
      repository.find.mockResolvedValue([mockStudio]);

      const result = await service.findAll('tenant-123');

      expect(result).toEqual([mockStudio]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['rooms'],
      });
    });
  });

  describe('findOne', () => {
    it('should return studio by id', async () => {
      repository.findOne.mockResolvedValue(mockStudio);

      const result = await service.findOne('studio-123', 'tenant-123');

      expect(result).toBe(mockStudio);
    });

    it('should throw NotFoundException if studio not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Studio',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      country: 'USA',
    };

    it('should create a studio with generated slug', async () => {
      repository.create.mockReturnValue(mockStudio);
      repository.save.mockResolvedValue(mockStudio);

      await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Studio',
          slug: 'new-studio',
          tenantId: 'tenant-123',
        }),
      );
    });

    it('should generate proper slug from name with special characters', async () => {
      const dtoWithSpecialName = {
        ...createDto,
        name: 'Café & Fitness Studio!',
      };
      repository.create.mockReturnValue(mockStudio);
      repository.save.mockResolvedValue(mockStudio);

      await service.create(dtoWithSpecialName, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'caf-fitness-studio',
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Studio' };

    it('should update studio', async () => {
      repository.findOne.mockResolvedValue(mockStudio);
      repository.save.mockResolvedValue({ ...mockStudio, ...updateDto });

      const result = await service.update(
        'studio-123',
        updateDto,
        'tenant-123',
      );

      expect(result.name).toBe('Updated Studio');
    });

    it('should throw NotFoundException if studio not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete by setting active to false', async () => {
      repository.findOne.mockResolvedValue(mockStudio);
      repository.save.mockImplementation(async (s) => s as Studio);

      await service.remove('studio-123', 'tenant-123');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });
  });
});
