
import "../src/config/env";
import { sequelize } from "../src/config/db";
import { runMigrations } from "../src/migrations/runner";
import { seedCatalog } from "../src/seeders/catalogSeeder";

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await runMigrations();
    console.log("Migrations up to date");

    await seedCatalog();
    console.log("Done");
  } catch (err) {
    console.error("Catalog seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
