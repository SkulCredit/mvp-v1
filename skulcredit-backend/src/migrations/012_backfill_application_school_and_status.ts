import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Guard: if loan_applications doesn't exist yet (fresh DB where sync() runs
  // after migrations), skip — the backfill is a no-op on an empty table anyway.
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  await queryInterface.sequelize.query(`
    UPDATE loan_applications la
    SET school_id = s.id
    FROM schools s
    JOIN catalog_schools cs ON LOWER(cs.name) = LOWER(s.school_name)
    WHERE la.catalog_school_id = cs.id
      AND la.school_id IS NULL
  `);

  await queryInterface.sequelize.query(`
    UPDATE loan_applications
    SET status = 'school_verification'
    WHERE status = 'pending'
      AND school_id IS NOT NULL
  `);
};

export const down = async (_queryInterface: QueryInterface): Promise<void> => {
 };
