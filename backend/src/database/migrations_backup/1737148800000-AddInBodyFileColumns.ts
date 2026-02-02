import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInBodyFileColumns1737148800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inbody_scans',
      new TableColumn({
        name: 'file_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'inbody_scans',
      new TableColumn({
        name: 'file_name',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inbody_scans', 'file_name');
    await queryRunner.dropColumn('inbody_scans', 'file_url');
  }
}
