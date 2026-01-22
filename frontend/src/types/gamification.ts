export const AchievementType = {
    SESSIONS_5: 'sessions_5',
    SESSIONS_10: 'sessions_10',
    SESSIONS_25: 'sessions_25',
    SESSIONS_50: 'sessions_50',
    SESSIONS_100: 'sessions_100',
    STREAK_7_DAYS: 'streak_7_days',
    STREAK_30_DAYS: 'streak_30_days',
    STREAK_90_DAYS: 'streak_90_days',
    BODY_FAT_MILESTONE_5: 'body_fat_milestone_5',
    BODY_FAT_MILESTONE_10: 'body_fat_milestone_10',
    MUSCLE_GAIN_5: 'muscle_gain_5',
    MUSCLE_GAIN_10: 'muscle_gain_10',
    FIRST_REVIEW: 'first_review',
    REVIEWS_5: 'reviews_5',
    REFERRAL: 'referral',
} as const;

export type AchievementType = typeof AchievementType[keyof typeof AchievementType];
