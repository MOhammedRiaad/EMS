import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitingListService } from './waiting-list.service';
import {
  WaitingListEntry,
  WaitingListStatus,
} from './entities/waiting-list.entity';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SessionsService } from '../sessions/sessions.service';
import { StudiosService } from '../studios/studios.service';
import { ClientsService } from '../clients/clients.service';

describe('WaitingListService', () => {
  let service: WaitingListService;
  let repository: jest.Mocked<Repository<WaitingListEntry>>;

  const mockEntry = {
    id: 'entry-123',
    tenantId: 'tenant-123',
    clientId: 'client-123',
    studioId: 'studio-123',
    status: WaitingListStatus.PENDING,
    priority: 1000,
    preferredDate: new Date('2026-02-01'),
    preferredTimeSlot: '10:00-12:00',
    notes: 'Test note',
    createdAt: new Date(),
    client: { id: 'client-123', firstName: 'John', email: 'john@example.com' },
    studio: { id: 'studio-123', name: 'Downtown Studio' },
  } as unknown as WaitingListEntry;

  const createMockQueryBuilder = (results: any[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitingListService,
        {
          provide: getRepositoryToken(WaitingListEntry),
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
          provide: StudiosService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ClientsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<WaitingListService>(WaitingListService);
    repository = module.get(getRepositoryToken(WaitingListEntry));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      clientId: 'client-123',
      studioId: 'studio-123',
      preferredDate: '2026-02-01',
      preferredTimeSlot: '10:00-12:00',
      requiresApproval: true,
    };

    it('should create a waiting list entry with PENDING status when requires approval', async () => {
      repository.create.mockReturnValue(mockEntry);
      repository.save.mockResolvedValue(mockEntry);

      const result = await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenantId: 'tenant-123',
          status: WaitingListStatus.PENDING,
        }),
      );
      expect(result).toBe(mockEntry);
    });

    it('should create with APPROVED status when no approval required', async () => {
      const dtoNoApproval = { ...createDto, requiresApproval: false };
      repository.create.mockReturnValue(mockEntry);
      repository.save.mockResolvedValue(mockEntry);

      await service.create(dtoNoApproval, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WaitingListStatus.APPROVED,
        }),
      );
    });

    it('should set priority based on timestamp', async () => {
      repository.create.mockReturnValue(mockEntry);
      repository.save.mockResolvedValue(mockEntry);

      await service.create(createDto, 'tenant-123');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: expect.any(Number),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return entry by id', async () => {
      repository.findOne.mockResolvedValue(mockEntry);

      const result = await service.findOne('entry-123', 'tenant-123');

      expect(result).toBe(mockEntry);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-123', tenantId: 'tenant-123' },
        relations: [
          'client',
          'studio',
          'coach',
          'session',
          'session.room',
          'approver',
        ],
      });
    });

    it('should throw NotFoundException if entry not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all entries for tenant', async () => {
      const mockQb = createMockQueryBuilder([mockEntry]);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAll('tenant-123');

      expect(result).toEqual([mockEntry]);
    });

    it('should filter by status when provided', async () => {
      const mockQb = createMockQueryBuilder([mockEntry]);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll('tenant-123', {
        status: WaitingListStatus.PENDING,
      });

      expect(mockQb.andWhere).toHaveBeenCalledWith('entry.status = :status', {
        status: WaitingListStatus.PENDING,
      });
    });

    it('should filter by studioId when provided', async () => {
      const mockQb = createMockQueryBuilder([mockEntry]);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll('tenant-123', { studioId: 'studio-123' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'entry.studioId = :studioId',
        { studioId: 'studio-123' },
      );
    });
  });

  describe('findByClient', () => {
    it('should return entries for specific client', async () => {
      repository.find.mockResolvedValue([mockEntry]);

      const result = await service.findByClient('client-123', 'tenant-123');

      expect(result).toEqual([mockEntry]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { clientId: 'client-123', tenantId: 'tenant-123' },
        relations: ['studio', 'coach', 'session', 'session.room'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    const updateDto = { notes: 'Updated notes' };

    it('should update entry successfully', async () => {
      repository.findOne.mockResolvedValue(mockEntry);
      repository.save.mockResolvedValue({ ...mockEntry, ...updateDto });

      const result = await service.update('entry-123', updateDto, 'tenant-123');

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw NotFoundException if entry not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete entry successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(
        service.remove('entry-123', 'tenant-123'),
      ).resolves.not.toThrow();

      expect(repository.delete).toHaveBeenCalledWith({
        id: 'entry-123',
        tenantId: 'tenant-123',
      });
    });

    it('should throw NotFoundException if entry not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove('nonexistent', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve entry and set approver info', async () => {
      const pendingEntry = { ...mockEntry, status: WaitingListStatus.PENDING };
      repository.findOne.mockResolvedValue(pendingEntry);
      repository.save.mockImplementation(async (e) => e as WaitingListEntry);

      const result = await service.approve(
        'entry-123',
        'approver-123',
        'tenant-123',
      );

      expect(result.status).toBe(WaitingListStatus.APPROVED);
      expect(result.approvedBy).toBe('approver-123');
      expect(result.approvedAt).toBeInstanceOf(Date);
    });
  });

  describe('reject', () => {
    it('should mark entry as cancelled', async () => {
      repository.findOne.mockResolvedValue(mockEntry);
      repository.save.mockImplementation(async (e) => e as WaitingListEntry);

      const result = await service.reject('entry-123', 'tenant-123');

      expect(result.status).toBe(WaitingListStatus.CANCELLED);
    });
  });

  describe('updatePriority', () => {
    it('should update entry priority', async () => {
      repository.findOne.mockResolvedValue(mockEntry);
      repository.save.mockImplementation(async (e) => e as WaitingListEntry);

      const result = await service.updatePriority(
        'entry-123',
        500,
        'tenant-123',
      );

      expect(result.priority).toBe(500);
    });
  });

  describe('notifyClient', () => {
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    it('should send notification email and update status', async () => {
      repository.findOne.mockResolvedValue(mockEntry);
      repository.save.mockImplementation(async (e) => e as WaitingListEntry);

      const result = await service.notifyClient(
        'entry-123',
        'tenant-123',
        mockMailerService,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        'john@example.com',
        expect.stringContaining('Spot is Available'),
        expect.any(String),
        expect.any(String),
      );
      expect(result.status).toBe(WaitingListStatus.NOTIFIED);
      expect(result.notifiedAt).toBeInstanceOf(Date);
    });

    it('should throw error if client has no email', async () => {
      const entryNoEmail = {
        ...mockEntry,
        client: { ...mockEntry.client, email: null },
      };
      repository.findOne.mockResolvedValue(entryNoEmail as any);

      await expect(
        service.notifyClient('entry-123', 'tenant-123', mockMailerService),
      ).rejects.toThrow('Client email not found');
    });
  });

  describe('markAsBooked', () => {
    it('should mark entry as booked', async () => {
      repository.findOne.mockResolvedValue(mockEntry);
      repository.save.mockImplementation(async (e) => e as WaitingListEntry);

      const result = await service.markAsBooked('entry-123', 'tenant-123');

      expect(result.status).toBe(WaitingListStatus.BOOKED);
    });
  });
});
