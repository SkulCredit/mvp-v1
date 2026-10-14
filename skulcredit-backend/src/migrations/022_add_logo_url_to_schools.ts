import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDesc = await queryInterface.describeTable("schools");
  if (!tableDesc["logo_url"]) {
    await queryInterface.addColumn("schools", "logo_url", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDesc = await queryInterface.describeTable("schools");
  if (tableDesc["logo_url"]) {
    await queryInterface.removeColumn("schools", "logo_url");
  }
};
