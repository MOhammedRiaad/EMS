import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddRecurrenceToSessions1705800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add recurrence columns to sessions table
        await queryRunner.addColumns('sessions', [
            new TableColumn({
                name: 'recurrence_pattern',
                type: 'varchar',
                length: '20',
                isNullable: true,
            }),
            new TableColumn({
                name: 'recurrence_end_date',
                type: 'date',
                isNullable: true,
            }),
            new TableColumn({
                name: 'parent_session_id',
                type: 'uuid',
                isNullable: true,
            }),
            new TableColumn({
                name: 'is_recurring_parent',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'recurrence_days',
                type: 'text',
                isNullable: true,
            }),
        ]);

        // Add foreign key for parent session
        await queryRunner.createForeignKey(
            'sessions',
            new TableForeignKey({
                columnNames: ['parent_session_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'sessions',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key first
        const table = await queryRunner.getTable('sessions');
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes('parent_session_id'));
        if (foreignKey) {
            await queryRunner.dropForeignKey('sessions', foreignKey);
        }

        // Remove columns
        await queryRunner.dropColumn('sessions', 'is_recurring_parent');
        await queryRunner.dropColumn('sessions', 'parent_session_id');
        await queryRunner.dropColumn('sessions', 'recurrence_end_date');
        await queryRunner.dropColumn('sessions', 'recurrence_pattern');
    }
}
