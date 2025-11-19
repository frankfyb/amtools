import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = process.env.DIRECT_URL;

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: datasourceUrl } } });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;