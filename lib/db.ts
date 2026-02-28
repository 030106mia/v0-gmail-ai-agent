import { PrismaClient } from "@/lib/generated/prisma/client"
import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/client"

function createAdapter(): SqlDriverAdapterFactory {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client")
    const client = createClient({ url: tursoUrl, authToken: tursoToken })
    return new PrismaLibSQL(client)
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path")
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db")
  return new PrismaBetterSqlite3({ url: dbPath })
}

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient }

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = new PrismaClient({ adapter: createAdapter() })
    }
    return (globalForPrisma._prisma as never)[prop]
  },
})
