import { QueryInterface, DataTypes } from "sequelize";

/**
 * Migration 007: Create school_terms table.
 *
 * This table holds the national school calendar terms that control
 * when the parent application portal is open and what repayment
 * tenors are available.
 */
export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("school_terms")) return;

  await queryInterface.createTable("school_terms", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    portal_open_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    portal_close_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    max_tenor_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Unique constraint: no duplicate term name in the same academic year
  await queryInterface.addIndex("school_terms", ["name", "academic_year"], {
    unique: true,
    name: "school_terms_name_academic_year_unique",
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("school_terms");
};
