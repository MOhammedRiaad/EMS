import { Test, TestingModule } from '@nestjs/testing';
import { WaiversService } from './waivers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Waiver } from './entities/waiver.entity';
import { ClientWaiver } from './entities/client-waiver.entity';
import { ClientsService } from '../clients/clients.service';
import { Repository } from 'typeorm';

describe('WaiversService', () => {
  let service: WaiversService;
  let waiverRepo: Repository<Waiver>;
  let clientWaiverRepo: Repository<ClientWaiver>;
  let clientsService: ClientsService;

  const mockWaiverRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockClientWaiverRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockClientsService = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaiversService,
        { provide: getRepositoryToken(Waiver), useValue: mockWaiverRepo },
        {
          provide: getRepositoryToken(ClientWaiver),
          useValue: mockClientWaiverRepo,
        },
        { provide: ClientsService, useValue: mockClientsService },
      ],
    }).compile();

    service = module.get<WaiversService>(WaiversService);
    waiverRepo = module.get(getRepositoryToken(Waiver));
    clientWaiverRepo = module.get(getRepositoryToken(ClientWaiver));
    clientsService = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLatestWaiver', () => {
    it('should return existing active waiver', async () => {
      const waiver = {
        id: 'w1',
        version: '1.0',
        content: 'test',
        isActive: true,
      };
      mockWaiverRepo.findOne.mockResolvedValue(waiver);

      const result = await service.getLatestWaiver('tenant-1');
      expect(result).toEqual(waiver);
      expect(mockWaiverRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should create default waiver if none exists', async () => {
      mockWaiverRepo.findOne.mockResolvedValue(null);
      const newWaiver = {
        id: 'w-new',
        version: '1.0',
        content: 'default',
        isActive: true,
      };
      mockWaiverRepo.create.mockReturnValue(newWaiver);
      mockWaiverRepo.save.mockResolvedValue(newWaiver);

      const result = await service.getLatestWaiver('tenant-1');
      expect(result).toEqual(newWaiver);
      expect(mockWaiverRepo.create).toHaveBeenCalled();
      expect(mockWaiverRepo.save).toHaveBeenCalled();
    });
  });

  describe('getClientSignatureStatus', () => {
    it('should return signed=false if no signature found', async () => {
      const userId = 'u1';
      const client = { id: 'c1' };
      const waiver = { id: 'w1' };

      mockClientsService.findByUserId.mockResolvedValue(client);
      mockWaiverRepo.findOne.mockResolvedValue(waiver);
      mockClientWaiverRepo.findOne.mockResolvedValue(null);

      const result = await service.getClientSignatureStatus('tenant-1', userId);
      expect(result.signed).toBe(false);
      expect(mockClientWaiverRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', clientId: 'c1', waiverId: 'w1' },
      });
    });

    it('should return signed=true if signature found', async () => {
      const userId = 'u1';
      const client = { id: 'c1' };
      const waiver = { id: 'w1' };
      const signature = { id: 's1', signedAt: new Date() };

      mockClientsService.findByUserId.mockResolvedValue(client);
      mockWaiverRepo.findOne.mockResolvedValue(waiver);
      mockClientWaiverRepo.findOne.mockResolvedValue(signature);

      const result = await service.getClientSignatureStatus('tenant-1', userId);
      expect(result.signed).toBe(true);
      expect(result.signedAt).toBeDefined();
    });
  });

  describe('signWaiver', () => {
    it('should create signature record', async () => {
      const userId = 'u1';
      const dto = {
        waiverId: 'w1',
        signatureData: 'data:image/png;base64,...',
      };
      const client = { id: 'c1' };
      const waiver = { id: 'w1' };
      const signature = { id: 's1', clientId: 'c1', waiverId: 'w1' };

      mockClientsService.findByUserId.mockResolvedValue(client);
      mockWaiverRepo.findOne.mockResolvedValue(waiver);
      mockClientWaiverRepo.findOne.mockResolvedValue(null); // Not already signed
      mockClientWaiverRepo.create.mockReturnValue(signature);
      mockClientWaiverRepo.save.mockResolvedValue(signature);

      const result = await service.signWaiver(
        'tenant-1',
        userId,
        dto,
        '1.2.3.4',
        'Mozilla/5.0',
      );
      expect(result).toEqual(signature);
      expect(mockClientWaiverRepo.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        clientId: 'c1',
        waiverId: 'w1',
        signatureData: dto.signatureData,
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should throw if already signed', async () => {
      const userId = 'u1';
      const dto = { waiverId: 'w1', signatureData: '...' };
      const client = { id: 'c1' };
      const waiver = { id: 'w1' };

      mockClientsService.findByUserId.mockResolvedValue(client);
      mockWaiverRepo.findOne.mockResolvedValue(waiver);
      mockClientWaiverRepo.findOne.mockResolvedValue({ id: 's1' });

      await expect(
        service.signWaiver('tenant-1', userId, dto, 'ip', 'ua'),
      ).rejects.toThrow('Waiver already signed');
    });
  });
});
