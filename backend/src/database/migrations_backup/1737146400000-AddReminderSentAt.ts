import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReminderSentAt1737146400000 implements MigrationInterface {
  name = 'AddReminderSentAt1737146400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add reminder_sent_at column to sessions table
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'reminder_sent_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sessions', 'reminder_sent_at');
  }
}
