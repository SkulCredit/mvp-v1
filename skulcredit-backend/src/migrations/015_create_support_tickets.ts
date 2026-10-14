import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("support_tickets")) return;

  await queryInterface.createTable("support_tickets", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    user_role: {
      type: DataTypes.ENUM("parent", "school", "admin"),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    admin_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    replied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
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

  await queryInterface.addIndex("support_tickets", ["user_id"]);
  await queryInterface.addIndex("support_tickets", ["status"]);
  await queryInterface.addIndex("support_tickets", ["priority"]);
  await queryInterface.addIndex("support_tickets", ["assigned_to"]);
  await queryInterface.addIndex("support_tickets", ["created_at"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("support_tickets")) return;
  await queryInterface.dropTable("support_tickets");
};
