import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ClientSessionReview } from './entities/review.entity';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { Session } from '../sessions/entities/session.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ClientSessionReview)
    private readonly reviewRepository: Repository<ClientSessionReview>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateReviewDto,
    tenantId: string,
    clientId: string,
  ): Promise<ClientSessionReview> {
    // Verify session exists and is completed
    const session = await this.sessionRepository.findOne({
      where: { id: dto.sessionId, tenantId },
      relations: ['client'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'completed') {
      throw new BadRequestException('Can only review completed sessions');
    }

    // Verify user is the client of this session
    if (session.clientId !== clientId) {
      throw new BadRequestException('You can only review your own sessions');
    }

    // Check if review already exists
    const existing = await this.reviewRepository.findOne({
      where: { sessionId: dto.sessionId, tenantId },
    });

    if (existing) {
      throw new BadRequestException(
        'Review already submitted for this session',
      );
    }

    const review = this.reviewRepository.create({
      ...dto,
      tenantId,
      clientId: session.clientId,
      coachId: session.coachId,
    });

    const savedReview = await this.reviewRepository.save(review);

    await this.auditService.log(
      tenantId,
      'CREATE_REVIEW',
      'Review',
      savedReview.id,
      clientId,
      { sessionId: dto.sessionId, rating: dto.rating },
    );

    return savedReview;
  }

  async findBySession(
    sessionId: string,
    tenantId: string,
  ): Promise<ClientSessionReview | null> {
    return this.reviewRepository.findOne({
      where: { sessionId, tenantId },
      relations: ['client', 'coach'],
    });
  }

  async findByCoach(
    coachId: string,
    tenantId: string,
    query?: ReviewQueryDto,
  ): Promise<ClientSessionReview[]> {
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .where('review.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.session', 'session')
      .orderBy('review.created_at', 'DESC');

    // Only filter by coachId if it's not 'all'
    if (coachId !== 'all') {
      qb.andWhere('review.coach_id = :coachId', { coachId });
    }

    if (query?.minRating) {
      qb.andWhere('review.rating >= :minRating', {
        minRating: query.minRating,
      });
    }

    return qb.getMany();
  }

  async getCoachStats(
    coachId: string,
    tenantId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'total')
      .where('review.tenant_id = :tenantId', { tenantId });

    // Only filter by coachId if it's not 'all'
    if (coachId !== 'all') {
      qb.andWhere('review.coach_id = :coachId', { coachId });
    }

    const result = await qb.getRawOne();

    return {
      averageRating: parseFloat(result.average) || 0,
      totalReviews: parseInt(result.total) || 0,
    };
  }
}
