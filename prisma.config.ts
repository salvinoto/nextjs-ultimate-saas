import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI uses this for migrations - MUST be direct connection (port 5432)
    // Falls back to DATABASE_URL for local dev where pooling isn't needed
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})
