import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderService } from './reminder.service';
import { Session } from '../sessions/entities/session.entity';
import { MailerService } from '../mailer/mailer.service';
import { TenantsService } from '../tenants/tenants.service';

describe('ReminderService', () => {
    let service: ReminderService;
    let sessionRepository: jest.Mocked<Repository<Session>>;
    let mailerService: jest.Mocked<MailerService>;
    let tenantsService: jest.Mocked<TenantsService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReminderService,
                {
                    provide: getRepositoryToken(Session),
                    useValue: {
                        find: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn(),
                    },
                },
                {
                    provide: TenantsService,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ReminderService>(ReminderService);
        sessionRepository = module.get(getRepositoryToken(Session));
        mailerService = module.get(MailerService);
        tenantsService = module.get(TenantsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendSessionReminders', () => {
        it('should fetch upcoming sessions and send emails using tenant config', async () => {
            const mockSession = {
                id: 'session-123',
                tenantId: 'tenant-123',
                startTime: new Date(Date.now() + 3600000),
                client: { email: 'client@example.com', firstName: 'John' },
                coach: { user: { firstName: 'Coach' } },
                studio: { name: 'Studio A' },
            };

            sessionRepository.find.mockResolvedValue([mockSession] as any);
            tenantsService.findOne.mockResolvedValue({
                id: 'tenant-123',
                settings: {
                    emailConfig: { host: 'smtp.tenant.com' },
                },
            } as any);

            await service.sendSessionReminders();

            expect(sessionRepository.find).toHaveBeenCalled();
            expect(tenantsService.findOne).toHaveBeenCalledWith('tenant-123');
            expect(mailerService.sendMail).toHaveBeenCalledWith(
                'client@example.com',
                expect.any(String),
                expect.any(String),
                expect.any(String),
                { host: 'smtp.tenant.com' },
            );
        });
    });
});
