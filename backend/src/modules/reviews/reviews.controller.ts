import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { TenantId } from '../../common/decorators';
import { TenantGuard } from '../../common/guards';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a review for a completed session' })
    create(@Body() dto: CreateReviewDto, @TenantId() tenantId: string, @Request() req: any) {
        return this.reviewsService.create(dto, tenantId, req.user.userId);
    }

    @Get('session/:sessionId')
    @ApiOperation({ summary: 'Get review for a specific session' })
    findBySession(@Param('sessionId') sessionId: string, @TenantId() tenantId: string) {
        return this.reviewsService.findBySession(sessionId, tenantId);
    }

    @Get('coach/:coachId')
    @ApiOperation({ summary: 'Get reviews for a coach (Admin only)' })
    findByCoach(
        @Param('coachId') coachId: string,
        @Query() query: ReviewQueryDto,
        @TenantId() tenantId: string
    ) {
        return this.reviewsService.findByCoach(coachId, tenantId, query);
    }

    @Get('coach/:coachId/stats')
    @ApiOperation({ summary: 'Get coach rating statistics (Admin only)' })
    getCoachStats(@Param('coachId') coachId: string, @TenantId() tenantId: string) {
        return this.reviewsService.getCoachStats(coachId, tenantId);
    }
}
