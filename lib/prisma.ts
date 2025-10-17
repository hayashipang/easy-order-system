import { PrismaClient } from '@prisma/client';

// 使用單例 Prisma 客戶端，避免連接過多
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL,
    },
  },
  // Vercel 優化配置
  ...(process.env.VERCEL && {
    // 在 Vercel 環境中優化連接池
    __internal: {
      engine: {
        connectTimeout: 60000,
        queryTimeout: 60000,
      },
    },
  }),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
