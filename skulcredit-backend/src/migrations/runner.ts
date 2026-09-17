/**
 * Lightweight migration runner.
 *
 * Keeps a `schema_migrations` table that tracks which migration files have
 * been applied. On every startup it imports each migration in filename order
 * and runs `up()` if the migration hasn't been recorded yet.
 */
import path from "path";
import fs from "fs";
import { QueryInterface, DataTypes, QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

const MIGRATIONS_TABLE = "schema_migrations";

async function ensureMigrationsTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name        VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(): Promise<Set<string>> {
  const rows = await sequelize.query<{ name: string }>(
    `SELECT name FROM ${MIGRATIONS_TABLE}`,
    { type: QueryTypes.SELECT },
  );
  return new Set(rows.map((r) => r.name));
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await appliedMigrations();
  const qi: QueryInterface = sequelize.getQueryInterface();

  const migrationsDir = __dirname;
  const files = fs
    .readdirSync(migrationsDir)
    // Match only numbered migration files — .ts in dev, .js in prod dist
    .filter((f) => /^\d+_[^.]+\.(ts|js)$/.test(f))
    .sort();

  for (const file of files) {
    // Use the base name (without extension) as the migration key
    const name = file.replace(/\.(ts|js)$/, "");
    if (applied.has(name)) continue;

    logger.info(`Running migration: ${name}`);

    // dynamic import works for both CJS and ESM compiled output
    const mod = (await import(path.join(migrationsDir, file))) as {
      up: (qi: QueryInterface) => Promise<void>;
    };

    await mod.up(qi);

    await sequelize.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (:name) ON CONFLICT (name) DO NOTHING`,
      { replacements: { name }, type: QueryTypes.INSERT },
    );
    logger.info(`Migration applied: ${name}`);
  }
}
