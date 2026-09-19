import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("students")) return;

  await queryInterface.sequelize.query(`
    ALTER TABLE students
      DROP CONSTRAINT IF EXISTS students_school_id_fkey
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE students
      ADD CONSTRAINT students_school_id_fkey
      FOREIGN KEY (school_id)
      REFERENCES catalog_schools(id)
      ON DELETE RESTRICT
  `);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("students")) return;

  await queryInterface.sequelize.query(`
    ALTER TABLE students
      DROP CONSTRAINT IF EXISTS students_school_id_fkey
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE students
      ADD CONSTRAINT students_school_id_fkey
      FOREIGN KEY (school_id)
      REFERENCES schools(id)
      ON DELETE RESTRICT
  `);
};
