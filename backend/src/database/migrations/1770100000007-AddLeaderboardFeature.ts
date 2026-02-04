import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddLeaderboardFeature1770100000007 implements MigrationInterface {
    name = 'AddLeaderboardFeature1770100000007';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add the feature flag
        await queryRunner.query(`
            INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key) DO NOTHING;
        `, [
            uuidv4(),
            'client.leaderboard',
            'Leaderboard',
            'Client leaderboard and rankings',
            'client',
            false,
            JSON.stringify([]),
            false
        ]);

        // 2. Add to Plans (Pro and Enterprise)
        // We need to fetch the existing features for these plans and append the new one.

        // Helper to add feature to plan
        const addFeatureToPlan = async (planKey: string) => {
            const plan = await queryRunner.query(`SELECT features FROM plans WHERE key = $1`, [planKey]);
            if (plan && plan.length > 0) {
                const features = plan[0].features;
                if (!features.includes('client.leaderboard')) {
                    features.push('client.leaderboard');
                    await queryRunner.query(`UPDATE plans SET features = $1 WHERE key = $2`, [JSON.stringify(features), planKey]);
                }
            }
        };

        await addFeatureToPlan('pro');
        await addFeatureToPlan('enterprise');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove from plans
        const removeFeatureFromPlan = async (planKey: string) => {
            const plan = await queryRunner.query(`SELECT features FROM plans WHERE key = $1`, [planKey]);
            if (plan && plan.length > 0) {
                const features = plan[0].features.filter((f: string) => f !== 'client.leaderboard');
                await queryRunner.query(`UPDATE plans SET features = $1 WHERE key = $2`, [JSON.stringify(features), planKey]);
            }
        };

        await removeFeatureFromPlan('pro');
        await removeFeatureFromPlan('enterprise');

        // Remove feature flag
        await queryRunner.query(`DELETE FROM feature_flags WHERE key = 'client.leaderboard'`);
    }
}
