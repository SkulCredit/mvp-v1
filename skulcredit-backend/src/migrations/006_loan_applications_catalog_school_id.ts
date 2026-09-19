import { QueryInterface, DataTypes } from "sequelize";


export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");

  if (!cols.catalog_school_id) {
    await queryInterface.addColumn("loan_applications", "catalog_school_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "catalog_schools", key: "id" },
      onDelete: "RESTRICT",
    });
  }

  await queryInterface.sequelize.query(`
    ALTER TABLE loan_applications
      ALTER COLUMN school_id DROP NOT NULL
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE loan_applications
      DROP CONSTRAINT IF EXISTS loan_applications_school_id_fkey
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE loan_applications
      ADD CONSTRAINT loan_applications_school_id_fkey
      FOREIGN KEY (school_id)
      REFERENCES schools(id)
      ON DELETE RESTRICT
  `);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");
  if (cols.catalog_school_id) {
    await queryInterface.removeColumn("loan_applications", "catalog_school_id");
  }

  await queryInterface.sequelize.query(`
    ALTER TABLE loan_applications
      ALTER COLUMN school_id SET NOT NULL
  `);
};
