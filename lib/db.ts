import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create a singleton Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return null;
  }

  try {
    const pool = globalForPrisma.pool ?? new Pool({ connectionString });
    if (!globalForPrisma.pool) globalForPrisma.pool = pool;
    
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch {
    return null;
  }
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createPrismaClient();
    if (!client) {
      throw new Error("Database not configured. Please complete the setup wizard.");
    }
    globalForPrisma.prisma = client;
  }
  return globalForPrisma.prisma;
}

// Lazy proxy that only initializes Prisma when first accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export default prisma;
