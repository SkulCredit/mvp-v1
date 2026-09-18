/**
 * scripts/seedCatalog.ts
 *
 * Thin wrapper around src/seeders/catalogSeeder.ts for use as a standalone
 * CLI command:
 *
 *   npm run seed:catalog
 *
 * All data and logic lives in the seeder module so the same code runs both
 * here and inside the production server on startup.
 */

import "../src/config/env";
import { sequelize } from "../src/config/db";
import { runMigrations } from "../src/migrations/runner";
import { seedCatalog } from "../src/seeders/catalogSeeder";

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✓ DB connected");

    await runMigrations();
    console.log("✓ Migrations up to date");

    await seedCatalog();
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Catalog seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
