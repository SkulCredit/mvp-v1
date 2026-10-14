import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("audit_logs")) return;

  await queryInterface.createTable("audit_logs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    actor_role: {
      type: DataTypes.ENUM("admin", "parent", "school", "system"),
      allowNull: false,
      defaultValue: "system",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    request_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex("audit_logs", ["actor_id"]);
  await queryInterface.addIndex("audit_logs", ["action"]);
  await queryInterface.addIndex("audit_logs", ["entity_type", "entity_id"]);
  await queryInterface.addIndex("audit_logs", ["created_at"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("audit_logs")) return;
  await queryInterface.dropTable("audit_logs");
};
