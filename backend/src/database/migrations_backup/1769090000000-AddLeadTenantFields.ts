import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLeadTenantFields1769090000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("leads", new TableColumn({
            name: "tenant_id",
            type: "varchar",
            isNullable: true, // Initially nullable to support existing data
        }));

        await queryRunner.addColumn("leads", new TableColumn({
            name: "studio_id",
            type: "varchar",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("leads", "studio_id");
        await queryRunner.dropColumn("leads", "tenant_id");
    }

}
