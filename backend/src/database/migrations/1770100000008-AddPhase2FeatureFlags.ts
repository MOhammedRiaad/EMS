import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddPhase2FeatureFlags1770100000008 implements MigrationInterface {
    name = 'AddPhase2FeatureFlags1770100000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add feature flags
        const newFeatures = [
            {
                key: 'core.advanced_calendar',
                name: 'Advanced Calendar',
                description: 'Enables the new advanced calendar with resource views and drag-and-drop.',
                category: 'core',
                defaultEnabled: false,
                dependencies: ['core.sessions'],
                isExperimental: false,
            },
            {
                key: 'core.data_import',
                name: 'Data Import',
                description: 'Enables bulk data import wizard for clients and coaches.',
                category: 'core',
                defaultEnabled: false,
                dependencies: [],
                isExperimental: false,
            },
        ];

        for (const feature of newFeatures) {
            await queryRunner.query(
                `
            INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key) DO NOTHING;
        `,
                [
                    uuidv4(),
                    feature.key,
                    feature.name,
                    feature.description,
                    feature.category,
                    feature.defaultEnabled,
                    JSON.stringify(feature.dependencies),
                    feature.isExperimental,
                ],
            );
        }

        // 2. Add to Plans (Pro and Enterprise)
        const addFeatureToPlan = async (planKey: string, featureKey: string) => {
            const plan = await queryRunner.query(
                `SELECT features FROM plans WHERE key = $1`,
                [planKey],
            );
            if (plan && plan.length > 0) {
                const features = plan[0].features;
                if (!features.includes(featureKey)) {
                    features.push(featureKey);
                    await queryRunner.query(
                        `UPDATE plans SET features = $1 WHERE key = $2`,
                        [JSON.stringify(features), planKey],
                    );
                }
            }
        };

        // Add both features to pro and enterprise
        await addFeatureToPlan('pro', 'core.advanced_calendar');
        await addFeatureToPlan('enterprise', 'core.advanced_calendar');

        await addFeatureToPlan('pro', 'core.data_import');
        await addFeatureToPlan('enterprise', 'core.data_import');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const featuresToRemove = ['core.advanced_calendar', 'core.data_import'];

        // Remove from plans
        const removeFeatureFromPlan = async (planKey: string, featureKey: string) => {
            const plan = await queryRunner.query(
                `SELECT features FROM plans WHERE key = $1`,
                [planKey],
            );
            if (plan && plan.length > 0) {
                const features = plan[0].features.filter(
                    (f: string) => f !== featureKey,
                );
                await queryRunner.query(
                    `UPDATE plans SET features = $1 WHERE key = $2`,
                    [JSON.stringify(features), planKey],
                );
            }
        };

        for (const featureKey of featuresToRemove) {
            await removeFeatureFromPlan('pro', featureKey);
            await removeFeatureFromPlan('enterprise', featureKey);

            // Remove feature flag
            await queryRunner.query(
                `DELETE FROM feature_flags WHERE key = $1`,
                [featureKey]
            );
        }
    }
}
