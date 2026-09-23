import "../src/config/env";
import { sequelize } from "../src/config/db";
import { runMigrations } from "../src/migrations/runner";
import "../src/models/index";
import FundingPartner from "../src/models/FundingPartner";

const PARTNERS = [
  {
    name: "Test User",
    email: "Eurekafortunatong@gmail.com",
    phone: null,
    contactPerson: null,
    status: "active" as const,
    notes: null,
  },
];

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await runMigrations();
    console.log("Migrations up to date");

    for (const partner of PARTNERS) {
      const [record, created] = await FundingPartner.findOrCreate({
        where: { email: partner.email },
        defaults: partner,
      });

      if (created) {
        console.log(`Created funding partner: ${record.name} <${record.email}>`);
      } else {
        await record.update({ name: partner.name, status: partner.status });
        console.log(`Updated funding partner: ${record.name} <${record.email}> (already existed)`);
      }
    }

    console.log("Done.");
  } catch (err) {
    console.error("Funding partner seed failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
