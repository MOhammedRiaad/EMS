import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class ResetOwnerPassword1770745000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const email = 'owner@ems-studio.com';
        const password = 'PlatformOwner123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const users = await queryRunner.query(`SELECT id FROM users WHERE email = '${email}'`);

        if (users.length > 0) {
            // Update existing user
            await queryRunner.query(
                `UPDATE users 
                 SET password_hash = '${hashedPassword}', 
                     active = true, 
                     email_verified = true, 
                     role = 'owner' 
                 WHERE email = '${email}'`
            );
            console.log(`Updated password for ${email}`);
        } else {
            console.log(`User ${email} not found, skipping update. (Check seed logic if this user is missing)`);
            // Optionally we could insert here, but usually seed handles insertion. 
            // Given the request is "not logging in", implies user exists but creds are wrong.
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No revert logic for password reset
    }
}
