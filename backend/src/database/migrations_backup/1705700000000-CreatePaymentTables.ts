import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePaymentTables1705700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Packages table
    await queryRunner.createTable(
      new Table({
        name: 'packages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'total_sessions', type: 'int', isNullable: false },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          { name: 'validity_days', type: 'int', default: 30 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'packages',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Client Packages table
    await queryRunner.createTable(
      new Table({
        name: 'client_packages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'client_id', type: 'uuid', isNullable: false },
          { name: 'package_id', type: 'uuid', isNullable: false },
          { name: 'purchase_date', type: 'date', isNullable: false },
          { name: 'expiry_date', type: 'date', isNullable: false },
          { name: 'sessions_used', type: 'int', default: 0 },
          { name: 'sessions_remaining', type: 'int', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          { name: 'payment_notes', type: 'text', isNullable: true },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'client_packages',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'client_packages',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'client_packages',
      new TableForeignKey({
        columnNames: ['package_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'packages',
        onDelete: 'RESTRICT',
      }),
    );

    // Transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'studio_id', type: 'uuid', isNullable: true },
          { name: 'type', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'category',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'running_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'reference_id', type: 'uuid', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['studio_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'studios',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
    await queryRunner.dropTable('client_packages');
    await queryRunner.dropTable('packages');
  }
}
