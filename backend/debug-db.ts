
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

console.log('Connecting with config:');
console.log({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'ems_user',
    password: process.env.POSTGRES_PASSWORD || 'ems_secret',
    database: process.env.POSTGRES_DB || 'ems_studio',
});

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'ems_user',
    password: process.env.POSTGRES_PASSWORD || 'ems_secret',
    database: process.env.POSTGRES_DB || 'ems_studio',
    entities: [],
    synchronize: false,
});

dataSource.initialize()
    .then(async () => {
        console.log('Data Source initialized. Running migration queries...');
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            console.log('Adding specific columns...');
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT '0'`);
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP WITH TIME ZONE`);
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_two_factor_enabled" boolean NOT NULL DEFAULT false`);
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" character varying`);
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" character varying`);
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP WITH TIME ZONE`);
            console.log('Migration queries executed successfully!');
        } catch (e) {
            console.error('Error running queries:', e);
        } finally {
            await queryRunner.release();
        }

        process.exit(0);
    })
    .catch((err) => {
        console.error('Error during Data Source initialization', err);
        process.exit(1);
    });
