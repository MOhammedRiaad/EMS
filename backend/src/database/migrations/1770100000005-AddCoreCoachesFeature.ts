import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddCoreCoachesFeature1770100000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the new Feature Flag
        const coreCoachesFeature = {
            key: 'core.coaches',
            name: 'Coach Management',
            category: 'core',
            defaultEnabled: true,
            description: 'manage coaches',
        };

        await queryRunner.query(`
            INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key) DO NOTHING;
        `, [
            uuidv4(),
            coreCoachesFeature.key,
            coreCoachesFeature.name,
            coreCoachesFeature.description,
            coreCoachesFeature.category,
            coreCoachesFeature.defaultEnabled,
            JSON.stringify([]),
            false,
        ]);

        // 2. Add to all Plans (Trial, Starter, Pro, Enterprise)
        // We fetch existing plans first to preserve their existing features
        const plans = await queryRunner.query(`SELECT id, key, features FROM plans`);

        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') {
                features = JSON.parse(features);
            }

            if (!features.includes('core.coaches')) {
                features.push('core.coaches');

                // Update the plan
                await queryRunner.query(`
                    UPDATE plans 
                    SET features = $1 
                    WHERE id = $2
                `, [JSON.stringify(features), plan.id]);
            }
        }

        // 3. Update existing tenants to include this feature if they are on a plan that has it (which is all of them)
        // or just rely on the fallback logic. 
        // But since we store "enabled features" often in cache or deriving, let's ensuring feature assignments are correct isn't needed 
        // because FeatureFlagService derives from Plan dynamically if no override.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove from plans
        const plans = await queryRunner.query(`SELECT id, features FROM plans`);
        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') features = JSON.parse(features);

            if (features.includes('core.coaches')) {
                features = features.filter((f: string) => f !== 'core.coaches');
                await queryRunner.query(`UPDATE plans SET features = $1 WHERE id = $2`, [JSON.stringify(features), plan.id]);
            }
        }

        // Delete feature flag
        await queryRunner.query(`DELETE FROM feature_flags WHERE key = 'core.coaches'`);
    }
}
