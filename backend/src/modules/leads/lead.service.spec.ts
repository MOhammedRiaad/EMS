import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadService } from './lead.service';
import { Lead, LeadStatus } from './entities/lead.entity';
import {
  LeadActivity,
  LeadActivityType,
} from './entities/lead-activity.entity';
import { ClientsService } from '../clients/clients.service';
import { AutomationService } from '../marketing/automation.service';
import { User } from '../auth/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AutomationTriggerType } from '../marketing/entities/automation-rule.entity';

describe('LeadService', () => {
  let service: LeadService;
  let leadRepository: jest.Mocked<Repository<Lead>>;
  let activityRepository: jest.Mocked<Repository<LeadActivity>>;
  let clientsService: jest.Mocked<ClientsService>;
  let automationService: jest.Mocked<AutomationService>;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  const mockLead = {
    id: 'lead-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    status: LeadStatus.NEW,
    createdAt: new Date(),
    updatedAt: new Date(),
    activities: [],
  } as unknown as Lead;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        {
          provide: getRepositoryToken(Lead),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockLead]),
            })),
          },
        },
        {
          provide: getRepositoryToken(LeadActivity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ClientsService,
          useValue: {
            createWithUser: jest.fn(),
            invite: jest.fn(),
          },
        },
        {
          provide: AutomationService,
          useValue: {
            triggerEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeadService>(LeadService);
    leadRepository = module.get(getRepositoryToken(Lead));
    activityRepository = module.get(getRepositoryToken(LeadActivity));
    clientsService = module.get(ClientsService);
    automationService = module.get(AutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a lead and trigger NEW_LEAD automation', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      leadRepository.create.mockReturnValue(mockLead);
      leadRepository.save.mockResolvedValue(mockLead);

      const result = await service.create(
        createDto,
        mockUser.tenantId,
        mockUser,
      );

      expect(leadRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: LeadStatus.NEW,
        tenantId: mockUser.tenantId,
      });
      expect(leadRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
      expect(automationService.triggerEvent).toHaveBeenCalledWith(
        AutomationTriggerType.NEW_LEAD,
        { lead: mockLead },
      );
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      const createDto = { firstName: 'John', lastName: 'Doe' };
      await expect(service.create(createDto, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should filter by tenantId', async () => {
      const filter = { status: LeadStatus.NEW };
      const tenantId = 'tenant-123';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLead]),
      };

      leadRepository.createQueryBuilder = jest.fn(
        () => mockQueryBuilder as any,
      );

      await service.findAll(filter, tenantId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'lead.tenantId = :tenantId',
        { tenantId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'lead.status = :status',
        { status: LeadStatus.NEW },
      );
    });
  });

  describe('update', () => {
    it('should update lead status and trigger LEAD_STATUS_CHANGED automation', async () => {
      const updateDto = { status: LeadStatus.CONTACTED };
      leadRepository.findOne.mockResolvedValue(mockLead);
      leadRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.update('lead-123', updateDto, mockUser.tenantId, mockUser);

      expect(leadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'lead-123', tenantId: mockUser.tenantId },
        relations: expect.any(Array),
      });

      expect(leadRepository.update).toHaveBeenCalledWith(
        { id: 'lead-123', tenantId: mockUser.tenantId },
        { status: LeadStatus.CONTACTED },
      );

      expect(automationService.triggerEvent).toHaveBeenCalledWith(
        AutomationTriggerType.LEAD_STATUS_CHANGED,
        {
          lead: mockLead,
          oldStatus: LeadStatus.NEW,
          newStatus: LeadStatus.CONTACTED,
        },
      );
    });

    it('should throw BadRequest if tenantId is missing', async () => {
      await expect(service.update('lead-123', {}, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove lead by id and tenantId', async () => {
      const tenantId = 'tenant-123';
      leadRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('lead-123', tenantId);

      expect(leadRepository.delete).toHaveBeenCalledWith({
        id: 'lead-123',
        tenantId,
      });
    });

    it('should throw NotFoundException if not found', async () => {
      const tenantId = 'tenant-123';
      leadRepository.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('lead-123', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('convertToClient', () => {
    it('should convert lead to client, invite, and update status', async () => {
      leadRepository.findOne.mockResolvedValue(mockLead);
      clientsService.createWithUser.mockResolvedValue({
        id: 'client-123',
      } as any);
      clientsService.invite.mockResolvedValue(undefined); // void

      const result = await service.convertToClient('lead-123', mockUser);

      expect(leadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'lead-123', tenantId: mockUser.tenantId },
        relations: expect.any(Array),
      });

      expect(clientsService.createWithUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: mockLead.firstName,
          lastName: mockLead.lastName,
          email: mockLead.email,
        }),
        mockUser.tenantId,
      );

      expect(clientsService.invite).toHaveBeenCalledWith(
        'client-123',
        mockUser.tenantId,
      );

      expect(leadRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LeadStatus.CONVERTED,
        }),
      );

      expect(result.message).toBe('Lead converted successfully');
    });

    it('should throw BadRequest if lead already converted', async () => {
      const convertedLead = {
        ...mockLead,
        status: LeadStatus.CONVERTED,
      } as Lead;
      leadRepository.findOne.mockResolvedValue(convertedLead);

      await expect(
        service.convertToClient('lead-123', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if user has no tenantId', async () => {
      // No need to mock findOne here because it throws before calling it
      const noTenantUser = { ...mockUser, tenantId: undefined };

      await expect(
        service.convertToClient('lead-123', noTenantUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
