import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!datasourceUrl) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL for Prisma datasource');
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: datasourceUrl } } });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;