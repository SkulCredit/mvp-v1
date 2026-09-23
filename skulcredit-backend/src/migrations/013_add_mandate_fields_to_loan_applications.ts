import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");

  if (!cols.mandate_debit_day) {
    await queryInterface.addColumn("loan_applications", "mandate_debit_day", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (!cols.mandate_status) {
    await queryInterface.addColumn("loan_applications", "mandate_status", {
      type: DataTypes.ENUM("not_set", "pending", "active", "failed", "cancelled"),
      allowNull: false,
      defaultValue: "not_set",
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");
  if (cols.mandate_debit_day)
    await queryInterface.removeColumn("loan_applications", "mandate_debit_day");
  if (cols.mandate_status)
    await queryInterface.removeColumn("loan_applications", "mandate_status");
};
