import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddEmailConfigFeature1770100000100 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add the feature flag definition
        await queryRunner.query(
            `
            INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key) DO NOTHING;
        `,
            [
                uuidv4(),
                'core.email_config',
                'Custom Email Configuration',
                'Allow tenants to configure their own SMTP settings',
                'core',
                true, // Enabled by default for new assignments if we used that logic, but here we manually assign
                JSON.stringify([]),
                false,
            ],
        );

        // 2. Add to ALL plans
        const plans = await queryRunner.query(`SELECT id, key, features FROM plans`);

        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') {
                features = JSON.parse(features);
            }

            if (!Array.isArray(features)) {
                features = [];
            }

            if (!features.includes('core.email_config')) {
                features.push('core.email_config');

                await queryRunner.query(
                    `
                    UPDATE plans 
                    SET features = $1 
                    WHERE id = $2
                `,
                    [JSON.stringify(features), plan.id],
                );
            }
        }

        // 3. Optional: Add to existing tenants directly if they have a 'features' column and it's not synced from permission/plan yet?
        // Usually tenants inherit from plans, but sometimes they have overrides. 
        // Creating the flag and adding to plans should be enough if the system syncs them, 
        // but to be safe for immediate testing, let's update tenants too if they have a features list.

        // Check if tenants table has features column (it should based on previous file view)
        const tenants = await queryRunner.query(`SELECT id, features FROM tenants`);
        for (const tenant of tenants) {
            let features = tenant.features;
            // Handle both string and object/array JSONB return types depending on driver
            if (typeof features === 'string') {
                try { features = JSON.parse(features); } catch (e) { features = {}; }
            }

            // Tenant features might be an array of strings OR an object map (record<string, boolean>)
            // The entity definition said: features: Record<string, boolean>;
            // But the previous migration treated plan.features as array.
            // Let's check tenant.entity.ts again.
            // Line 36: @Column({ type: 'jsonb', default: {} }) features: Record<string, boolean>;

            // So for tenants, it's a map.
            if (!features) features = {};

            if (features['core.email_config'] === undefined) {
                features['core.email_config'] = true;

                await queryRunner.query(
                    `UPDATE tenants SET features = $1 WHERE id = $2`,
                    [JSON.stringify(features), tenant.id]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove from plans
        const plans = await queryRunner.query(`SELECT id, features FROM plans`);
        for (const plan of plans) {
            let features = plan.features;
            if (typeof features === 'string') features = JSON.parse(features);

            if (Array.isArray(features)) {
                features = features.filter((f: string) => f !== 'core.email_config');
                await queryRunner.query(`UPDATE plans SET features = $1 WHERE id = $2`, [
                    JSON.stringify(features),
                    plan.id,
                ]);
            }
        }

        // Connect to Tenants?? - Removing from tenants might be risky if we disable it for everyone, 
        // but for 'down' migration it's expected.
        const tenants = await queryRunner.query(`SELECT id, features FROM tenants`);
        for (const tenant of tenants) {
            let features = tenant.features;
            if (typeof features === 'string') try { features = JSON.parse(features); } catch { features = {}; }

            if (features && features['core.email_config']) {
                delete features['core.email_config'];
                await queryRunner.query(`UPDATE tenants SET features = $1 WHERE id = $2`, [
                    JSON.stringify(features),
                    tenant.id
                ]);
            }
        }

        // Delete feature flag
        await queryRunner.query(
            `DELETE FROM feature_flags WHERE key = 'core.email_config'`,
        );
    }
}
