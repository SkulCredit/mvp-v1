import { DataTypes, QueryInterface } from "sequelize";

export const up = async (qi: QueryInterface): Promise<void> => {
  await qi.sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'customer_service_manager'`);
  await qi.sequelize.query(`ALTER TYPE "enum_audit_logs_actor_role" ADD VALUE IF NOT EXISTS 'customer_service'`);
  await qi.sequelize.query(`ALTER TYPE "enum_audit_logs_actor_role" ADD VALUE IF NOT EXISTS 'customer_service_manager'`);
  await qi.sequelize.query(`ALTER TYPE "enum_support_tickets_status" ADD VALUE IF NOT EXISTS 'awaiting_customer'`);
  await qi.sequelize.query(`ALTER TYPE "enum_support_tickets_status" ADD VALUE IF NOT EXISTS 'escalated'`);

  const tables = await qi.showAllTables();

  if (!tables.includes("support_ticket_messages")) {
    await qi.createTable("support_ticket_messages", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "support_tickets", key: "id" },
        onDelete: "CASCADE",
      },
      author_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      author_type: {
        type: DataTypes.ENUM("submitter", "customer_service"),
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      visibility: {
        type: DataTypes.ENUM("public", "internal"),
        allowNull: false,
        defaultValue: "public",
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

    await qi.addIndex("support_ticket_messages", ["ticket_id"]);
    await qi.addIndex("support_ticket_messages", ["ticket_id", "visibility"]);
    await qi.addIndex("support_ticket_messages", ["created_at"]);
  }

  if (!tables.includes("support_ticket_tags")) {
    await qi.createTable("support_ticket_tags", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ticket_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "support_tickets", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      tagged_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      note: {
        type: DataTypes.TEXT,
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

    await qi.addIndex("support_ticket_tags", ["ticket_id", "user_id"], { unique: true });
    await qi.addIndex("support_ticket_tags", ["ticket_id"]);
    await qi.addIndex("support_ticket_tags", ["user_id"]);
    await qi.addIndex("support_ticket_tags", ["tagged_by"]);
  }
};

export const down = async (qi: QueryInterface): Promise<void> => {
  const tables = await qi.showAllTables();
  if (tables.includes("support_ticket_tags")) {
    await qi.dropTable("support_ticket_tags");
  }
  if (tables.includes("support_ticket_messages")) {
    await qi.dropTable("support_ticket_messages");
  }
};
