import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService enables database interaction using Prisma Client.
 * In Prisma 7, we must configure and pass a driver adapter (PrismaPg) 
 * built on a pg Pool to connection-manage our PostgreSQL database.
 * 
 * Prisma 7 मा direct database url schema मा support नहुने हुनाले,
 * runtime मा explicit pg adapter र connection pool pass गर्नुपर्छ।
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in the environment variables!');
    }

    // 1. Create a PostgreSQL connection pool
    // PostgreSQL सँग connection pool बनाउने
    const pool = new Pool({ connectionString });

    // 2. Wrap it with the Prisma PostgreSQL adapter
    // Prisma को pg adapter मा pool राख्ने
    const adapter = new PrismaPg(pool);

    // 3. Initialize the PrismaClient via super constructor
    // PrismaClient constructor लाई adapter दिने
    super({ adapter });

    this.pool = pool;
  }

  // When NestJS module initializes, establish connection
  // Module load हुँदा database सँग connection सुरु गर्ने
  async onModuleInit() {
    await this.$connect();
  }

  // Clean up database connection and close pool when application shuts down
  // Application बन्द हुँदा connection र pool बन्द गर्ने
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
