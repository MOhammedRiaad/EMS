import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ClientSessionReview } from './entities/review.entity';
import { Session } from '../sessions/entities/session.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ClientSessionReview, Session]),
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
