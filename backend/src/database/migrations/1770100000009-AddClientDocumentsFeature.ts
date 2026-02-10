import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddClientDocumentsFeature1770100000009 implements MigrationInterface {
    name = 'AddClientDocumentsFeature1770100000009';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create client_documents table
        await queryRunner.query(`
      CREATE TABLE client_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        category VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (category IN ('contract', 'waiver', 'medical', 'certificate', 'other')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        // 2. Create indexes
        await queryRunner.query(`
      CREATE INDEX idx_client_documents_client_id ON client_documents(client_id);
    `);
        await queryRunner.query(`
      CREATE INDEX idx_client_documents_tenant_id ON client_documents(tenant_id);
    `);
        await queryRunner.query(`
      CREATE INDEX idx_client_documents_category ON client_documents(category);
    `);

        // 3. Add feature flag
        const featureFlag = {
            key: 'client.documents',
            name: 'Client Documents',
            description: 'Enables document upload and management for clients (contracts, waivers, certificates, etc.)',
            category: 'client',
            defaultEnabled: false,
            dependencies: [],
            isExperimental: false,
        };

        await queryRunner.query(
            `
        INSERT INTO feature_flags (id, key, name, description, category, default_enabled, dependencies, is_experimental)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (key) DO NOTHING;
      `,
            [
                uuidv4(),
                featureFlag.key,
                featureFlag.name,
                featureFlag.description,
                featureFlag.category,
                featureFlag.defaultEnabled,
                JSON.stringify(featureFlag.dependencies),
                featureFlag.isExperimental,
            ],
        );

        // 4. Add to Pro and Enterprise plans
        const addFeatureToPlan = async (planKey: string) => {
            const plan = await queryRunner.query(
                `SELECT features FROM plans WHERE key = $1`,
                [planKey],
            );
            if (plan && plan.length > 0) {
                const features = plan[0].features;
                if (!features.includes(featureFlag.key)) {
                    features.push(featureFlag.key);
                    await queryRunner.query(
                        `UPDATE plans SET features = $1 WHERE key = $2`,
                        [JSON.stringify(features), planKey],
                    );
                }
            }
        };

        await addFeatureToPlan('pro');
        await addFeatureToPlan('enterprise');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove from plans
        const removeFeatureFromPlan = async (planKey: string) => {
            const plan = await queryRunner.query(
                `SELECT features FROM plans WHERE key = $1`,
                [planKey],
            );
            if (plan && plan.length > 0) {
                const features = plan[0].features.filter(
                    (f: string) => f !== 'client.documents',
                );
                await queryRunner.query(
                    `UPDATE plans SET features = $1 WHERE key = $2`,
                    [JSON.stringify(features), planKey],
                );
            }
        };

        await removeFeatureFromPlan('pro');
        await removeFeatureFromPlan('enterprise');

        // Remove feature flag
        await queryRunner.query(
            `DELETE FROM feature_flags WHERE key = $1`,
            ['client.documents'],
        );

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS client_documents;`);
    }
}
