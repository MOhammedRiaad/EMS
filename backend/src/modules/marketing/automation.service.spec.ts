import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { AutomationService } from './automation.service';
import {
  AutomationRule,
  AutomationTriggerType,
  AutomationActionType,
} from './entities/automation-rule.entity';
import {
  AutomationExecution,
  AutomationExecutionStatus,
} from './entities/automation-execution.entity';
import { MailerService } from '../mailer/mailer.service';
import { UsageTrackingService } from '../owner/services/usage-tracking.service';
import { AuditService } from '../audit/audit.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantsService } from '../tenants/tenants.service';

describe('AutomationService', () => {
  let service: AutomationService;
  let ruleRepository: jest.Mocked<Repository<AutomationRule>>;
  let executionRepository: jest.Mocked<Repository<AutomationExecution>>;
  let mailerService: jest.Mocked<MailerService>;

  const mockRule = {
    id: 'rule-123',
    name: 'Test Rule',
    triggerType: AutomationTriggerType.NEW_LEAD,
    isActive: true,
    actions: [
      {
        id: '1',
        type: AutomationActionType.SEND_EMAIL,
        delayMinutes: 0,
        payload: { subject: 'Hi' },
        order: 0,
      },
      {
        id: '2',
        type: AutomationActionType.SEND_EMAIL,
        delayMinutes: 60,
        payload: { subject: 'Followup' },
        order: 1,
      },
    ],
  } as AutomationRule;

  const mockExecution = {
    id: 'exec-123',
    ruleId: 'rule-123',
    tenantId: 'default',
    entityId: 'client-123',
    currentStepIndex: 0,
    status: AutomationExecutionStatus.PENDING,
    nextRunAt: new Date(Date.now() - 1000), // Past
    context: { email: 'test@example.com' },
    rule: mockRule,
  } as AutomationExecution;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AutomationExecution),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
            sendTemplatedMail: jest
              .fn()
              .mockResolvedValue({ messageId: '123' }),
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
          provide: UsageTrackingService,
          useValue: {
            checkLimit: jest.fn().mockResolvedValue(null),
            recordMetric: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: WhatsAppService,
          useValue: {
            sendTemplateMessage: jest.fn(),
            sendFreeFormMessage: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: TenantsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'tenant-123', settings: {} }),
          },
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    ruleRepository = module.get(getRepositoryToken(AutomationRule));
    executionRepository = module.get(getRepositoryToken(AutomationExecution));
    mailerService = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerEvent', () => {
    it('should create execution for active rules', async () => {
      const tenantId = 'tenant-123';
      ruleRepository.find.mockResolvedValue([mockRule]);
      executionRepository.create.mockReturnValue(mockExecution);
      executionRepository.save.mockResolvedValue(mockExecution);

      await service.triggerEvent(AutomationTriggerType.NEW_LEAD, {
        clientId: 'client-123',
        tenantId,
      });

      expect(ruleRepository.find).toHaveBeenCalledTimes(1);
      expect(ruleRepository.find).toHaveBeenCalledWith({
        where: {
          triggerType: AutomationTriggerType.NEW_LEAD,
          isActive: true,
          tenantId,
        },
      });
      expect(executionRepository.create).toHaveBeenCalledTimes(1);
      expect(executionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: mockRule.id,
          entityId: 'client-123',
          tenantId,
          status: AutomationExecutionStatus.PENDING,
          currentStepIndex: 0,
          context: { clientId: 'client-123', tenantId: 'tenant-123' },
        }),
      );
      expect(executionRepository.save).toHaveBeenCalledTimes(1);
      expect(executionRepository.save).toHaveBeenCalledWith(mockExecution);
    });

    it('should not create execution if tenantId is missing in context', async () => {
      ruleRepository.find.mockResolvedValue([]); // No rules found for undefined tenantId
      executionRepository.create.mockClear();
      executionRepository.save.mockClear();

      await service.triggerEvent(AutomationTriggerType.NEW_LEAD, {
        clientId: 'client-123',
        // tenantId is intentionally missing
      });

      expect(ruleRepository.find).not.toHaveBeenCalled();
      expect(executionRepository.create).not.toHaveBeenCalled();
      expect(executionRepository.save).not.toHaveBeenCalled();
    });

    it('should handle SESSION_COMPLETED trigger with client context', async () => {
      const tenantId = 'tenant-123';
      const sessionRule = {
        ...mockRule,
        id: 'rule-session',
        triggerType: AutomationTriggerType.SESSION_COMPLETED,
      };
      ruleRepository.find.mockResolvedValue([sessionRule]);
      executionRepository.create.mockReturnValue(mockExecution);
      executionRepository.save.mockResolvedValue(mockExecution);

      await service.triggerEvent(AutomationTriggerType.SESSION_COMPLETED, {
        tenantId,
        clientId: 'client-123',
        client: {
          id: 'client-123',
          tenantId,
          user: { email: 'test@example.com' },
        },
        session: { id: 'session-123' },
      });

      expect(ruleRepository.find).toHaveBeenCalledWith({
        where: {
          triggerType: AutomationTriggerType.SESSION_COMPLETED,
          isActive: true,
          tenantId,
        },
      });
      expect(executionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: sessionRule.id,
          entityId: 'client-123',
          tenantId,
        }),
      );
    });
  });

  describe('findAllExecutions', () => {
    it('should return paginated executions', async () => {
      const tenantId = 'tenant-123';
      const expectedData = [mockExecution];
      const expectedTotal = 1;
      executionRepository.findAndCount.mockResolvedValue([
        expectedData,
        expectedTotal,
      ]);

      // Test default params
      const result = await service.findAllExecutions(tenantId);

      expect(result).toEqual({
        data: expectedData,
        total: expectedTotal,
        page: 1,
        limit: 50,
      });
      expect(executionRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId },
        relations: ['rule'],
        order: { createdAt: 'DESC' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect custom pagination params', async () => {
      const tenantId = 'tenant-123';
      const expectedData = [mockExecution];
      const expectedTotal = 55;
      executionRepository.findAndCount.mockResolvedValue([
        expectedData,
        expectedTotal,
      ]);

      const result = await service.findAllExecutions(tenantId, {
        page: 2,
        limit: 20,
      });

      expect(result).toEqual({
        data: expectedData,
        total: expectedTotal,
        page: 2,
        limit: 20,
      });
      expect(executionRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId },
        relations: ['rule'],
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 20, // (2-1) * 20
      });
    });
  });

  describe('processPendingExecutions', () => {
    it('should execute pending step and schedule next', async () => {
      // Setup execution at step 0
      executionRepository.find.mockResolvedValue([mockExecution]);
      executionRepository.save.mockImplementation(
        async (e) => e as AutomationExecution,
      );

      await service.processPendingExecutions();

      // Should send email for step 0
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        'Hi', // From mockRule step 0 payload.subject
        'No content',
        expect.any(String),
        null,
      );

      // Should advance to step 1
      expect(executionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStepIndex: 1,
          // nextRunAt should be ~60 mins from now, but hard to test exact time logic with mock Date,
          // just ensure it was updated and saved
        }),
      );
    });

    it('should complete execution if no more steps', async () => {
      const lastStepExecution = {
        ...mockExecution,
        currentStepIndex: 1, // Last step in mockRule (length 2, index 1 is last)
      } as AutomationExecution;

      executionRepository.find.mockResolvedValue([lastStepExecution]);
      executionRepository.save.mockImplementation(
        async (e) => e as AutomationExecution,
      );

      await service.processPendingExecutions();

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        'Followup',
        expect.any(String),
        expect.any(String),
        null,
      );

      expect(executionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AutomationExecutionStatus.COMPLETED,
        }),
      );
    });
  });
});
