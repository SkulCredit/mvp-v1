import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("admin_profiles")) return;

  await queryInterface.createTable("admin_profiles", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    full_name: { type: DataTypes.STRING(150), allowNull: true },
    avatar_url: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex("admin_profiles", ["user_id"], { unique: true });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("admin_profiles")) return;
  await queryInterface.dropTable("admin_profiles");
};
