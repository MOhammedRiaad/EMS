import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TenantScopedEntity } from '../../../common/entities';
import { Client } from '../../clients/entities/client.entity';

export enum AchievementType {
    // Consistency Achievements
    SESSIONS_5 = 'sessions_5',
    SESSIONS_10 = 'sessions_10',
    SESSIONS_25 = 'sessions_25',
    SESSIONS_50 = 'sessions_50',
    SESSIONS_100 = 'sessions_100',

    // Streak Achievements
    STREAK_7_DAYS = 'streak_7_days',
    STREAK_30_DAYS = 'streak_30_days',
    STREAK_90_DAYS = 'streak_90_days',

    // Progress Achievements
    BODY_FAT_MILESTONE_5 = 'body_fat_milestone_5',
    BODY_FAT_MILESTONE_10 = 'body_fat_milestone_10',
    MUSCLE_GAIN_5 = 'muscle_gain_5',
    MUSCLE_GAIN_10 = 'muscle_gain_10',

    // Social Achievements
    FIRST_REVIEW = 'first_review',
    REVIEWS_5 = 'reviews_5',
    REFERRAL = 'referral',
}

@Entity('client_achievements')
export class ClientAchievement extends TenantScopedEntity {
    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @Column({
        type: 'enum',
        enum: AchievementType,
        name: 'achievement_type',
    })
    achievementType: AchievementType;

    @CreateDateColumn({ name: 'unlocked_at', type: 'timestamptz' })
    unlockedAt: Date;

    @ManyToOne(() => Client, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_id' })
    client: Client;
}
