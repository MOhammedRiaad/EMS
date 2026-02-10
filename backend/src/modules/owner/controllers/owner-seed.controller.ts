import { Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import express from 'express';

@ApiTags('Owner Seed (Public)')
@Controller('owner/seed-public')
export class OwnerSeedController {
    constructor(private readonly dataSource: DataSource) { }

    @Post()
    @ApiOperation({ summary: 'Seed Owner Account (Public/No Auth)' })
    @ApiResponse({ status: 200, description: 'Owner seeded successfully' })
    async seedOwner(@Res() res: express.Response) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const email = 'owner@ems-studio.com';
            const password = 'PlatformOwner123!';
            const hashedPassword = await bcrypt.hash(password, 10);

            // 1. Get a valid tenant (system tenant usually first)
            const tenants = await queryRunner.query(`SELECT id FROM tenants LIMIT 1`);
            let tenantId = null;
            if (tenants.length > 0) {
                tenantId = tenants[0].id;
            } else {
                await queryRunner.rollbackTransaction();
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .json({ message: 'No tenants found' });
            }

            // 2. Check if user exists
            const users = await queryRunner.query(
                `SELECT id FROM users WHERE email = $1`,
                [email],
            );
            let userId;

            if (users.length > 0) {
                userId = users[0].id;
                // Update existing user
                await queryRunner.query(
                    `UPDATE users 
                     SET password_hash = $1, 
                         active = true, 
                         email_verified = true, 
                         role = 'owner' 
                     WHERE email = $2`,
                    [hashedPassword, email],
                );
            } else {
                // Create user
                const result = await queryRunner.query(
                    `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, active, email_verified, gender, role)
                     VALUES ($1, $2, $3, 'Global', 'Platform Owner', true, true, 'other', 'owner')
                     RETURNING id`,
                    [tenantId, email, hashedPassword],
                );
                userId = result[0].id;
            }

            // 3. Ensure Role Assignment
            const roles = await queryRunner.query(
                `SELECT id FROM roles WHERE key = 'platform_owner'`,
            );
            if (roles.length > 0) {
                const roleId = roles[0].id;
                const assignment = await queryRunner.query(
                    `SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`,
                    [userId, roleId],
                );
                if (assignment.length === 0) {
                    await queryRunner.query(
                        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
                        [userId, roleId],
                    );
                }
            }

            await queryRunner.commitTransaction();
            return res.status(HttpStatus.OK).json({
                message: 'Owner account seeded successfully',
                email,
                password,
            });
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error seeding owner:', err);
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Failed to seed owner', error: err.message });
        } finally {
            await queryRunner.release();
        }
    }
}
