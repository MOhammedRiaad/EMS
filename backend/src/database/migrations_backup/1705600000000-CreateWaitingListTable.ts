import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateWaitingListTable1705600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "waiting_list",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()",
                },
                {
                    name: "tenant_id",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "client_id",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "session_id",
                    type: "uuid",
                    isNullable: true,
                },
                {
                    name: "studio_id",
                    type: "uuid",
                    isNullable: false,
                },
                {
                    name: "coach_id",
                    type: "uuid",
                    isNullable: true,
                },
                {
                    name: "preferred_date",
                    type: "date",
                    isNullable: true,
                },
                {
                    name: "preferred_time_slot",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'pending'",
                },
                {
                    name: "requires_approval",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "priority",
                    type: "bigint",
                    isNullable: true,
                },
                {
                    name: "approved_by",
                    type: "uuid",
                    isNullable: true,
                },
                {
                    name: "approved_at",
                    type: "timestamp",
                    isNullable: true,
                },
                {
                    name: "notified_at",
                    type: "timestamp",
                    isNullable: true,
                },
                {
                    name: "notification_method",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()",
                },
            ],
        }), true);

        // Add foreign keys
        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["tenant_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "tenants",
            onDelete: "CASCADE",
        }));

        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["client_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "clients",
            onDelete: "CASCADE",
        }));

        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["session_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "sessions",
            onDelete: "SET NULL",
        }));

        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["studio_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "studios",
            onDelete: "CASCADE",
        }));

        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["coach_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "coaches",
            onDelete: "SET NULL",
        }));

        await queryRunner.createForeignKey("waiting_list", new TableForeignKey({
            columnNames: ["approved_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "SET NULL",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("waiting_list");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("waiting_list", foreignKey);
            }
        }
        await queryRunner.dropTable("waiting_list");
    }
}
