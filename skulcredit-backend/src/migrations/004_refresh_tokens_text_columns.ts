/**
 * Migration 004 — Widen refresh_tokens token columns to TEXT
 *
 * Refresh tokens are now JWTs (~400-600 chars) instead of 40-byte hex
 * strings, so VARCHAR(500) is no longer sufficient.
 * Both `token` and `replaced_by_token` are widened to TEXT.
 */
import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("refresh_tokens")) return;

  const desc = await queryInterface.describeTable("refresh_tokens");

  // Widen token column if it isn't already TEXT
  if (desc.token && (desc.token as { type: string }).type !== "TEXT") {
    await queryInterface.changeColumn("refresh_tokens", "token", {
      type: DataTypes.TEXT,
      allowNull: false,
    });
  }

  // Widen replaced_by_token column if it isn't already TEXT
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
