import "../src/config/env";
import { sequelize } from "../src/config/db";
import { runMigrations } from "../src/migrations/runner";
import "../src/models/index";
import { seedSchools } from "../src/seeders/schoolSeeder";

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✓ DB connected");

    await runMigrations();
    console.log("✓ Migrations up to date");

    await seedSchools();
    console.log("✓ Done");

    console.log("\nSeeded school credentials (all share the same password):");
    console.log("  Password: School@2026\n");
    console.log("  REGISTERED (status: approved)");
    console.log("  ─────────────────────────────────────────────────────");
    console.log("  admin@gulfflowerschools.com         Gulf Flower Schools");
    console.log("  admin@fosterprimeschools.com        Foster Prime Schools");
    console.log("  admin@dothancomprehensive.com       Dothan Comprehensive Schools");
    console.log("  admin@starsinternationalcollege.com Stars International College");
    console.log("  admin@stjudesprivateschools.com     St. Jude's Private Schools");
    console.log("  admin@loralinternationalschools.com Loral International Schools");
    console.log("  admin@gracewoodinternational.com    Gracewood International School");
    console.log("  admin@camillabrookplace.com         Camilla Brook Place");
    console.log("\n  NON-REGISTERED (status: pending)");
    console.log("  ─────────────────────────────────────────────────────");
    console.log("  admin@pearlshoreacademy.com         Pearlshore Academy");
    console.log("  admin@emmychordschools.com          Emmychord Schools");
    console.log("  admin@allsensesschool.com           Allsenses School");
  } catch (err) {
    console.error("School seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
