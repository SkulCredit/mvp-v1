import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDescription = await queryInterface.describeTable("parents");
  if (!tableDescription.address_lga) {
    await queryInterface.addColumn("parents", "address_lga", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDescription = await queryInterface.describeTable("parents");
  if (tableDescription.address_lga) {
    await queryInterface.removeColumn("parents", "address_lga");
  }
};
