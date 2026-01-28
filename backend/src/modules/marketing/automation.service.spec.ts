import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationService } from './automation.service';
import { AutomationRule, AutomationTriggerType, AutomationActionType } from './entities/automation-rule.entity';

describe('AutomationService', () => {
    let service: AutomationService;
    let repository: jest.Mocked<Repository<AutomationRule>>;

    const mockRule = {
        id: 'rule-123',
        name: 'Test Rule',
        triggerType: AutomationTriggerType.NEW_LEAD,
        actionType: AutomationActionType.SEND_EMAIL,
        actionPayload: { subject: 'Hello' },
        isActive: true,
        conditions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    } as AutomationRule;

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
            ],
        }).compile();

        service = module.get<AutomationService>(AutomationService);
        repository = module.get(getRepositoryToken(AutomationRule));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a rule', async () => {
            const createDto = { name: 'New Rule' };
            repository.create.mockReturnValue(mockRule);
            repository.save.mockResolvedValue(mockRule);

            const result = await service.create(createDto);

            expect(repository.create).toHaveBeenCalledWith(createDto);
            expect(result).toBe(mockRule);
        });
    });

    describe('triggerEvent', () => {
        it('should find active rules and execute them', async () => {
            repository.find.mockResolvedValue([mockRule]);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await service.triggerEvent(AutomationTriggerType.NEW_LEAD, { leadId: '123' });

            expect(repository.find).toHaveBeenCalledWith({
                where: { triggerType: AutomationTriggerType.NEW_LEAD, isActive: true }
            });
            // Since executeAction is private and just logs, we check if it didn't crash
            // and maybe check if log happened (optional, implementation detail)
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Automation] Executing rule'),
                mockRule.actionPayload
            );

            consoleSpy.mockRestore();
        });

        it('should do nothing if no rules found', async () => {
            repository.find.mockResolvedValue([]);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await service.triggerEvent(AutomationTriggerType.NEW_LEAD, {});

            expect(repository.find).toHaveBeenCalled();
            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
