import { readdir, readFile } from "fs/promises";
import path from "path";

import { getDbPool } from "@/lib/db";

const globalForMigrate = globalThis as unknown as {
  migratePromise?: Promise<void>;
};

async function listMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const entries = await readdir(migrationsDir);
  return entries.filter((entry) => entry.endsWith(".sql")).sort();
}

export async function runMigrations(): Promise<void> {
  if (globalForMigrate.migratePromise) {
    return globalForMigrate.migratePromise;
  }

  globalForMigrate.migratePromise = (async () => {
    const pool = getDbPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = await listMigrationFiles();
    for (const filename of files) {
      const alreadyApplied = await pool.query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1`,
        [filename]
      );

      if ((alreadyApplied.rowCount ?? 0) > 0) {
        continue;
      }

      const sql = await readFile(path.join(process.cwd(), "migrations", filename), "utf8");
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (filename) VALUES ($1)`,
          [filename]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
  })();

  return globalForMigrate.migratePromise;
}
