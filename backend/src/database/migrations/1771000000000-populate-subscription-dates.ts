import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateSubscriptionDates1771000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Set subscription_ends_at for tenants where it's NULL
        // Logic: Calculate months elapsed since createdAt and set to the next monthly anniversary
        await queryRunner.query(`
      UPDATE tenants
      SET 
        subscription_ends_at = "created_at" + (
          INTERVAL '1 month' * (
            EXTRACT(YEAR FROM age(NOW(), "created_at")) * 12 +
            EXTRACT(MONTH FROM age(NOW(), "created_at")) + 
            CASE 
              WHEN "created_at" + (INTERVAL '1 month' * (EXTRACT(YEAR FROM age(NOW(), "created_at")) * 12 + EXTRACT(MONTH FROM age(NOW(), "created_at")))) <= NOW() 
              THEN 1 
              ELSE 0 
            END
          )
        ),
        auto_renew = true
      WHERE subscription_ends_at IS NULL;
    `);

        // Ensure auto_renew is true for all active tenants if not already set (optional but good for consistency)
        await queryRunner.query(`
      UPDATE tenants
      SET auto_renew = true
      WHERE auto_renew IS NULL;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // There is no reliable way to "undo" this without knowledge of previous NULL states,
        // and since we are populating missing data, a rollback isn't strictly necessary or safe to bulk nullify.
        // We can leave the dates as is.
    }
}
