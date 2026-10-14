import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");

  if (!cols.service_charge_rate) {
    await queryInterface.addColumn("loan_applications", "service_charge_rate", {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    });
  }

  if (!cols.service_charge_amount) {
    await queryInterface.addColumn("loan_applications", "service_charge_amount", {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("loan_applications")) return;

  const cols = await queryInterface.describeTable("loan_applications");
  if (cols.service_charge_rate)   await queryInterface.removeColumn("loan_applications", "service_charge_rate");
  if (cols.service_charge_amount) await queryInterface.removeColumn("loan_applications", "service_charge_amount");
};
