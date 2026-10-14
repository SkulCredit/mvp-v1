import "../src/config/env";
import { sequelize } from "../src/config/db";
import { runMigrations } from "../src/migrations/runner";
import "../src/models/index";
import { seedFundingPartners } from "../src/seeders/fundingPartnerSeeder";

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await runMigrations();
    console.log("Migrations up to date");

    await seedFundingPartners();
    console.log("Done");
  } catch (err) {
    console.error("Funding partner seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
