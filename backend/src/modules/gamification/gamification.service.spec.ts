import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { ClientAchievement } from './entities/client-achievement.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { ClientGoal } from './entities/client-goal.entity';
import { Client } from '../clients/entities/client.entity';
import { Repository } from 'typeorm';

describe('GamificationService', () => {
  let service: GamificationService;
  let clientRepo: Repository<Client>;
  let achievementRepo: Repository<ClientAchievement>;
  let sessionRepo: Repository<Session>;
  let reviewRepo: Repository<ClientSessionReview>;
  let goalRepo: Repository<ClientGoal>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientAchievement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientSessionReview),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientGoal),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    clientRepo = module.get(getRepositoryToken(Client));
    achievementRepo = module.get(getRepositoryToken(ClientAchievement));
    sessionRepo = module.get(getRepositoryToken(Session));
    reviewRepo = module.get(getRepositoryToken(ClientSessionReview));
    goalRepo = module.get(getRepositoryToken(ClientGoal));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests for checkAndUnlockAchievements logic if needed
});
