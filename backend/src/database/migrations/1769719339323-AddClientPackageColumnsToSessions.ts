import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddClientPackageColumnsToSessions1769719339323 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add client_package_id to sessions
        await queryRunner.addColumn('sessions', new TableColumn({
            name: 'client_package_id',
            type: 'uuid',
            isNullable: true,
        }));

        await queryRunner.createForeignKey('sessions', new TableForeignKey({
            columnNames: ['client_package_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'client_packages',
            onDelete: 'SET NULL',
        }));

        // Add client_package_id to session_participants
        await queryRunner.addColumn('session_participants', new TableColumn({
            name: 'client_package_id',
            type: 'uuid',
            isNullable: true,
        }));

        await queryRunner.createForeignKey('session_participants', new TableForeignKey({
            columnNames: ['client_package_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'client_packages',
            onDelete: 'SET NULL',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const sessionParticipantsTable = await queryRunner.getTable('session_participants');
        if (sessionParticipantsTable) {
            const participantsForeignKey = sessionParticipantsTable.foreignKeys.find(fk => fk.columnNames.indexOf('client_package_id') !== -1);
            if (participantsForeignKey) {
                await queryRunner.dropForeignKey('session_participants', participantsForeignKey);
            }
            await queryRunner.dropColumn('session_participants', 'client_package_id');
        }

        const sessionsTable = await queryRunner.getTable('sessions');
        if (sessionsTable) {
            const sessionsForeignKey = sessionsTable.foreignKeys.find(fk => fk.columnNames.indexOf('client_package_id') !== -1);
            if (sessionsForeignKey) {
                await queryRunner.dropForeignKey('sessions', sessionsForeignKey);
            }
            await queryRunner.dropColumn('sessions', 'client_package_id');
        }
    }

}
