import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ClientSessionReview } from './entities/review.entity';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { Session } from '../sessions/entities/session.entity';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(ClientSessionReview)
        private readonly reviewRepository: Repository<ClientSessionReview>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
    ) { }

    async create(dto: CreateReviewDto, tenantId: string, userId: string): Promise<ClientSessionReview> {
        // Verify session exists and is completed
        const session = await this.sessionRepository.findOne({
            where: { id: dto.sessionId, tenantId },
            relations: ['client', 'client.user'],
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status !== 'completed') {
            throw new BadRequestException('Can only review completed sessions');
        }

        // Verify user is the client of this session
        if (session.client?.userId !== userId) {
            throw new BadRequestException('You can only review your own sessions');
        }

        // Check if review already exists
        const existing = await this.reviewRepository.findOne({
            where: { sessionId: dto.sessionId, tenantId }
        });

        if (existing) {
            throw new BadRequestException('Review already submitted for this session');
        }

        const review = this.reviewRepository.create({
            ...dto,
            tenantId,
            clientId: session.clientId,
            coachId: session.coachId,
        });

        return this.reviewRepository.save(review);
    }

    async findBySession(sessionId: string, tenantId: string): Promise<ClientSessionReview | null> {
        return this.reviewRepository.findOne({
            where: { sessionId, tenantId },
            relations: ['client', 'coach'],
        });
    }

    async findByCoach(coachId: string, tenantId: string, query?: ReviewQueryDto): Promise<ClientSessionReview[]> {
        const qb = this.reviewRepository.createQueryBuilder('review')
            .where('review.tenant_id = :tenantId', { tenantId })
            .andWhere('review.coach_id = :coachId', { coachId })
            .leftJoinAndSelect('review.client', 'client')
            .leftJoinAndSelect('review.session', 'session')
            .orderBy('review.created_at', 'DESC');

        if (query?.minRating) {
            qb.andWhere('review.rating >= :minRating', { minRating: query.minRating });
        }

        return qb.getMany();
    }

    async getCoachStats(coachId: string, tenantId: string): Promise<{ averageRating: number; totalReviews: number }> {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'average')
            .addSelect('COUNT(*)', 'total')
            .where('review.tenant_id = :tenantId', { tenantId })
            .andWhere('review.coach_id = :coachId', { coachId })
            .getRawOne();

        return {
            averageRating: parseFloat(result.average) || 0,
            totalReviews: parseInt(result.total) || 0,
        };
    }
}
