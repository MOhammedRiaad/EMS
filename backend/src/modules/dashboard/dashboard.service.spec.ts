import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Session } from '../sessions/entities/session.entity';

describe('DashboardService', () => {
    let service: DashboardService;
    let clientsRepo: jest.Mocked<Repository<Client>>;
    let coachesRepo: jest.Mocked<Repository<Coach>>;
    let sessionsRepo: jest.Mocked<Repository<Session>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                {
                    provide: getRepositoryToken(Client),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Coach),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Session),
                    useValue: { count: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        clientsRepo = module.get(getRepositoryToken(Client));
        coachesRepo = module.get(getRepositoryToken(Coach));
        sessionsRepo = module.get(getRepositoryToken(Session));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getStats', () => {
        it('should return dashboard statistics', async () => {
            clientsRepo.count.mockResolvedValue(25);
            coachesRepo.count.mockResolvedValue(5);
            sessionsRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(100);

            const result = await service.getStats('tenant-123');

            expect(result).toEqual({
                activeClients: 25,
                activeCoaches: 5,
                todaySessions: 10,
                revenue: 4500, // 100 completed * 45
            });
        });

        it('should count active clients with correct filter', async () => {
            clientsRepo.count.mockResolvedValue(0);
            coachesRepo.count.mockResolvedValue(0);
            sessionsRepo.count.mockResolvedValue(0);

            await service.getStats('tenant-123');

            expect(clientsRepo.count).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-123', status: 'active' },
            });
        });

        it('should count active coaches', async () => {
            clientsRepo.count.mockResolvedValue(0);
            coachesRepo.count.mockResolvedValue(0);
            sessionsRepo.count.mockResolvedValue(0);

            await service.getStats('tenant-123');

            expect(coachesRepo.count).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-123', active: true },
            });
        });

        it('should calculate revenue from completed sessions', async () => {
            clientsRepo.count.mockResolvedValue(10);
            coachesRepo.count.mockResolvedValue(3);
            sessionsRepo.count.mockResolvedValueOnce(5).mockResolvedValueOnce(50);

            const result = await service.getStats('tenant-123');

            expect(result.revenue).toBe(2250); // 50 * 45
        });
    });
});
