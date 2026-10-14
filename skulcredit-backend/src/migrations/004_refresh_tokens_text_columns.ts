
import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("refresh_tokens")) return;

  const desc = await queryInterface.describeTable("refresh_tokens");

  if (desc.token && (desc.token as { type: string }).type !== "TEXT") {
    await queryInterface.changeColumn("refresh_tokens", "token", {
      type: DataTypes.TEXT,
      allowNull: false,
    });
  }

  if (
    desc.replaced_by_token &&
    (desc.replaced_by_token as { type: string }).type !== "TEXT"
  ) {
    await queryInterface.changeColumn("refresh_tokens", "replaced_by_token", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("refresh_tokens")) return;

  await queryInterface.changeColumn("refresh_tokens", "token", {
    type: DataTypes.STRING(500),
    allowNull: false,
  });
  await queryInterface.changeColumn("refresh_tokens", "replaced_by_token", {
    type: DataTypes.STRING(500),
    allowNull: true,
  });
};
