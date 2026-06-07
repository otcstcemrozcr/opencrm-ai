import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy singleton so importing this module never throws at build time
// (DATABASE_URL is only required when a query actually runs).
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
  drizzleDb?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  const client = globalForDb.pgClient ?? postgres(connectionString, { max: 10 });
  const dbInstance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pgClient = client;
    globalForDb.drizzleDb = dbInstance;
  }
  return dbInstance;
}

// Proxy that resolves the real db on first property access.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const real = getDb();
    const value = real[prop as keyof typeof real];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
