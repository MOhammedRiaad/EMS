import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule } from '@nestjs/common';

/**
 * Test database module using SQLite in-memory database.
 * This allows E2E tests to run without requiring an external PostgreSQL database.
 */
export const TestDatabaseModule: DynamicModule = TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: ':memory:',
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema: true,
  logging: false,
});
