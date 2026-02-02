import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { ClientSessionReview } from './entities/review.entity';
import { Session } from '../sessions/entities/session.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: jest.Mocked<Repository<ClientSessionReview>>;
  let sessionRepository: jest.Mocked<Repository<Session>>;

  const mockReview = {
    id: 'review-123',
    tenantId: 'tenant-123',
    sessionId: 'session-123',
    clientId: 'client-123',
    coachId: 'coach-123',
    rating: 5,
    comment: 'Great session!',
    createdAt: new Date(),
  } as unknown as ClientSessionReview;

  const mockSession = {
    id: 'session-123',
    tenantId: 'tenant-123',
    clientId: 'client-123',
    coachId: 'coach-123',
    status: 'completed',
    client: { id: 'client-123', firstName: 'John' },
  } as Session;

  const createMockQueryBuilder = (result: any) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getMany: jest
      .fn()
      .mockResolvedValue(Array.isArray(result) ? result : [result]),
    getRawOne: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(ClientSessionReview),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: require('../audit/audit.service').AuditService,
          useValue: {
            log: jest.fn(),
            calculateDiff: jest.fn().mockReturnValue({ changes: {} }),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(getRepositoryToken(ClientSessionReview));
    sessionRepository = module.get(getRepositoryToken(Session));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      sessionId: 'session-123',
      rating: 5,
      comment: 'Great session!',
    };

    it('should create a review for completed session', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue(mockReview);
      reviewRepository.save.mockResolvedValue(mockReview);

      const result = await service.create(
        createDto,
        'tenant-123',
        'client-123',
      );

      expect(result).toBe(mockReview);
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          rating: 5,
          tenantId: 'tenant-123',
          clientId: 'client-123',
          coachId: 'coach-123',
        }),
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createDto, 'tenant-123', 'client-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session not completed', async () => {
      sessionRepository.findOne.mockResolvedValue({
        ...mockSession,
        status: 'scheduled',
      });

      await expect(
        service.create(createDto, 'tenant-123', 'client-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if client not owner of session', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);

      await expect(
        service.create(createDto, 'tenant-123', 'different-client'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if review already exists', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);
      reviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(
        service.create(createDto, 'tenant-123', 'client-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBySession', () => {
    it('should return review for session', async () => {
      reviewRepository.findOne.mockResolvedValue(mockReview);

      const result = await service.findBySession('session-123', 'tenant-123');

      expect(result).toBe(mockReview);
      expect(reviewRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123', tenantId: 'tenant-123' },
        relations: ['client', 'coach'],
      });
    });

    it('should return null if no review exists', async () => {
      reviewRepository.findOne.mockResolvedValue(null);

      const result = await service.findBySession('session-123', 'tenant-123');

      expect(result).toBeNull();
    });
  });

  describe('findByCoach', () => {
    it('should return reviews for coach', async () => {
      const mockQb = createMockQueryBuilder([mockReview]);
      reviewRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findByCoach('coach-123', 'tenant-123');

      expect(result).toEqual([mockReview]);
    });

    it('should filter by minRating when provided', async () => {
      const mockQb = createMockQueryBuilder([mockReview]);
      reviewRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findByCoach('coach-123', 'tenant-123', { minRating: 4 });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'review.rating >= :minRating',
        { minRating: 4 },
      );
    });
  });

  describe('getCoachStats', () => {
    it('should return coach rating stats', async () => {
      const mockQb = createMockQueryBuilder({ average: '4.5', total: '10' });
      reviewRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getCoachStats('coach-123', 'tenant-123');

      expect(result).toEqual({
        averageRating: 4.5,
        totalReviews: 10,
      });
    });

    it('should return zeros when no reviews', async () => {
      const mockQb = createMockQueryBuilder({ average: null, total: '0' });
      reviewRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getCoachStats('coach-123', 'tenant-123');

      expect(result).toEqual({
        averageRating: 0,
        totalReviews: 0,
      });
    });
  });
});
