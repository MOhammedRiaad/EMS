import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<Repository<AuditLog>>;

  const mockAuditLog = {
    id: 'log-123',
    tenantId: 'tenant-123',
    action: 'UPDATE_CLIENT',
    entityType: 'Client',
    entityId: 'client-123',
    performedBy: 'user-123',
    details: { changes: { firstName: { old: 'John', new: 'Johnny' } } },
    createdAt: new Date(),
    ipAddress: '127.0.0.1',
  } as AuditLog;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log', async () => {
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      await service.log(
        'tenant-123',
        'UPDATE_CLIENT',
        'Client',
        'client-123',
        'user-123',
        { changes: {} },
        '127.0.0.1',
      );

      expect(repository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-123',
        action: 'UPDATE_CLIENT',
        entityType: 'Client',
        entityId: 'client-123',
        performedBy: 'user-123',
        details: { changes: {} },
        ipAddress: '127.0.0.1',
      });
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('should handle errors gracefully', async () => {
      repository.save.mockRejectedValue(new Error('DB Error'));
      // Should not throw
      await service.log('t', 'a', 'e', 'id', 'u');
    });
  });

  describe('calculateDiff', () => {
    it('should identify changed fields', () => {
      const oldObj = { name: 'Old', age: 30 };
      const newObj = { name: 'New', age: 30 };

      const diff = service.calculateDiff(oldObj, newObj);

      expect(diff.changes).toHaveProperty('name');
      expect(diff.changes.name).toEqual({ old: 'Old', new: 'New' });
      expect(diff.changes).not.toHaveProperty('age');
    });

    it('should handle undefined old values', () => {
      const oldObj = undefined;
      const newObj = { name: 'New' };

      const diff = service.calculateDiff(oldObj, newObj);

      expect(diff.changes).toHaveProperty('name');
      expect(diff.changes.name).toEqual({ old: undefined, new: 'New' });
    });

    it('should ignore specified keys', () => {
      const oldObj = { updatedAt: '2023-01-01', name: 'Same' };
      const newObj = { updatedAt: '2023-01-02', name: 'Same' };

      const diff = service.calculateDiff(oldObj, newObj);

      expect(Object.keys(diff.changes)).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return logs for tenant', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll('tenant-123', 50);

      expect(result).toEqual([mockAuditLog]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });
});
