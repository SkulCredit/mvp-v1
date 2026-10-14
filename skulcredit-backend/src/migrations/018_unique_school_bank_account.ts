import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("school_bank_account_details")) return;

  await queryInterface.sequelize.query(`
    DELETE FROM school_bank_account_details a
    USING school_bank_account_details b
    WHERE a.id > b.id
      AND a.catalog_school_id = b.catalog_school_id
      AND a.account_number    = b.account_number
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE school_bank_account_details
    ADD CONSTRAINT uq_school_bank_account UNIQUE (catalog_school_id, account_number)
  `);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.sequelize.query(`
    ALTER TABLE school_bank_account_details
    DROP CONSTRAINT IF EXISTS uq_school_bank_account
  `);
};
