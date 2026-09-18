import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Guard: if the parents table doesn't exist yet (fresh DB before first sync)
  // there is nothing to alter — skip safely.
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("parents")) return;

  const tableDescription = await queryInterface.describeTable("parents");
  if (!tableDescription.address_lga) {
    await queryInterface.addColumn("parents", "address_lga", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("parents")) return;

  const tableDescription = await queryInterface.describeTable("parents");
  if (tableDescription.address_lga) {
    await queryInterface.removeColumn("parents", "address_lga");
  }
};
