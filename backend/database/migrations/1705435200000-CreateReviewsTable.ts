import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReviewsTable1705435200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'client_session_reviews',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'tenant_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'session_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'client_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'coach_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'rating',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'comments',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'visible_to_admins',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create indices
        await queryRunner.createIndex(
            'client_session_reviews',
            new TableIndex({
                name: 'IDX_REVIEWS_COACH',
                columnNames: ['coach_id', 'tenant_id'],
            }),
        );

        await queryRunner.createIndex(
            'client_session_reviews',
            new TableIndex({
                name: 'IDX_REVIEWS_SESSION',
                columnNames: ['session_id'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'client_session_reviews',
            new TableIndex({
                name: 'IDX_REVIEWS_TENANT',
                columnNames: ['tenant_id'],
            }),
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'client_session_reviews',
            new TableForeignKey({
                columnNames: ['tenant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'tenants',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'client_session_reviews',
            new TableForeignKey({
                columnNames: ['session_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'sessions',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'client_session_reviews',
            new TableForeignKey({
                columnNames: ['client_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'clients',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'client_session_reviews',
            new TableForeignKey({
                columnNames: ['coach_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'coaches',
                onDelete: 'CASCADE',
            }),
        );

        // Add check constraint for rating
        await queryRunner.query(
            `ALTER TABLE client_session_reviews ADD CONSTRAINT CHK_RATING CHECK (rating >= 1 AND rating <= 5)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('client_session_reviews');
    }
}
