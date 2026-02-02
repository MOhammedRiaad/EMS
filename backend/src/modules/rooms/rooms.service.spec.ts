import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { NotFoundException } from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;
  let repository: jest.Mocked<Repository<Room>>;

  const mockRoom = {
    id: 'room-123',
    tenantId: 'tenant-123',
    studioId: 'studio-123',
    name: 'Room A',
    capacity: 2,
    active: true,
    studio: { id: 'studio-123', name: 'Downtown Studio' },
  } as Room;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    repository = module.get(getRepositoryToken(Room));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all rooms for tenant', async () => {
      repository.find.mockResolvedValue([mockRoom]);

      const result = await service.findAll('tenant-123');

      expect(result).toEqual([mockRoom]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['studio'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findByStudio', () => {
    it('should return active rooms for specific studio', async () => {
      repository.find.mockResolvedValue([mockRoom]);

      const result = await service.findByStudio('studio-123', 'tenant-123');

      expect(result).toEqual([mockRoom]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { studioId: 'studio-123', tenantId: 'tenant-123', active: true },
        relations: ['studio'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return room by id', async () => {
      repository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findOne('room-123', 'tenant-123');

      expect(result).toBe(mockRoom);
    });

    it('should throw NotFoundException if room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      studioId: 'studio-123',
      name: 'Room B',
      capacity: 3,
    };

    it('should create a room', async () => {
      repository.create.mockReturnValue(mockRoom);
      repository.save.mockResolvedValue(mockRoom);

      const result = await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-123',
      });
      expect(result).toBe(mockRoom);
    });

    it('should default capacity to 1 if not provided', async () => {
      const dtoNoCapacity = { studioId: 'studio-123', name: 'Room C' };
      repository.create.mockReturnValue(mockRoom);
      repository.save.mockResolvedValue(mockRoom);

      await service.create(dtoNoCapacity, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ capacity: 1 }),
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Room' };

    it('should update room', async () => {
      repository.findOne.mockResolvedValue(mockRoom);
      repository.save.mockResolvedValue({ ...mockRoom, ...updateDto });

      const result = await service.update('room-123', updateDto, 'tenant-123');

      expect(result.name).toBe('Updated Room');
    });

    it('should throw NotFoundException if room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete by setting active to false', async () => {
      repository.findOne.mockResolvedValue(mockRoom);
      repository.save.mockImplementation(async (r) => r as Room);

      await service.remove('room-123', 'tenant-123');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });
  });
});
