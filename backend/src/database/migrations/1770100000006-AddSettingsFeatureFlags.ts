import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddSettingsFeatureFlags1770100000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const newFeatures = [
            {
                key: 'core.branding',
                name: 'Custom Branding',
                category: 'core',
                defaultEnabled: false,
                description: 'customize tenant logo and colors',
            },
            {
                key: 'core.cancellation_policy',
                name: 'Cancellation Policy',
                category: 'core',
                defaultEnabled: true,
                description: 'configure cancellation window',
            }
        ];

        for (const feature of newFeatures) {
            await queryRunner.query(`
                INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (key) DO NOTHING;
            `, [
                uuidv4(),
                feature.key,
                feature.name,
                feature.description,
                feature.category,
                feature.defaultEnabled,
                JSON.stringify([]),
                false,
            ]);
        }

        // Add to all Plans by default for now (or strictly to Pro/Enterprise if desired, but user didn't specify strict availability)
        // Let's add branding to PRO and ENTERPRISE only, and cancellation_policy to ALL.
        const plans = await queryRunner.query(`SELECT id, key, features FROM plans`);

        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') {
                features = JSON.parse(features);
            }

            let updated = false;

            // Cancellation Policy - ALL plans
            if (!features.includes('core.cancellation_policy')) {
                features.push('core.cancellation_policy');
                updated = true;
            }

            // Branding - PRO and ENTERPRISE only
            if (['pro', 'enterprise'].includes(plan.key)) {
                if (!features.includes('core.branding')) {
                    features.push('core.branding');
                    updated = true;
                }
            }

            if (updated) {
                await queryRunner.query(`
                    UPDATE plans 
                    SET features = $1 
                    WHERE id = $2
                `, [JSON.stringify(features), plan.id]);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove from plans
        const plans = await queryRunner.query(`SELECT id, features FROM plans`);
        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') features = JSON.parse(features);

            features = features.filter((f: string) => !['core.branding', 'core.cancellation_policy'].includes(f));
            await queryRunner.query(`UPDATE plans SET features = $1 WHERE id = $2`, [JSON.stringify(features), plan.id]);
        }

        // Delete feature flags
        await queryRunner.query(`DELETE FROM feature_flags WHERE key IN ('core.branding', 'core.cancellation_policy')`);
    }
}
