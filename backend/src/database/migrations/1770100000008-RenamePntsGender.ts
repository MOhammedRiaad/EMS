import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePntsGender1770100000008 implements MigrationInterface {
    name = 'RenamePntsGender1770100000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename 'pnts' to 'prefer_not_to_say' in the enum
        await queryRunner.query(`
            ALTER TYPE "public"."users_gender_enum" RENAME VALUE 'pnts' TO 'prefer_not_to_say'
        `);

        // Check availability of 'pnts' in default values if it was set explicitly
        // If default was 'pnts', it automatically updates to the new name? 
        // Postgres handles the enum value rename including the default value if it is an enum literal.
        // Let's verify defaults.

        // Actually, let's play safe and ensure the default is updated if it was a string literal. 
        // In the previous migration: DEFAULT 'pnts'
        // TypeORM usually sets defaults as strings for Enums.

        // Let's explicitly set the default again to be sure.
        await queryRunner.query(`
            ALTER TABLE "users" ALTER COLUMN "gender" SET DEFAULT 'prefer_not_to_say'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" ALTER COLUMN "gender" SET DEFAULT 'pnts'
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."users_gender_enum" RENAME VALUE 'prefer_not_to_say' TO 'pnts'
        `);
    }
}
