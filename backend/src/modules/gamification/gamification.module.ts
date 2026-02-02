import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { ClientAchievement } from './entities/client-achievement.entity';
import { ClientGoal } from './entities/client-goal.entity';
import { FavoriteCoach } from './entities/favorite-coach.entity';
import { Challenge } from './entities/challenge.entity';
import { ClientChallengeProgress } from './entities/client-challenge-progress.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientAchievement,
      ClientGoal,
      FavoriteCoach,
      Challenge,
      ClientChallengeProgress,
      Session,
      ClientSessionReview,
      Client,
    ]),
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
