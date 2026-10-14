import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDesc = await queryInterface.describeTable("support_tickets").catch(() => null);
  if (!tableDesc) return;

  const addIfMissing = async (col: string, def: object) => {
    if (!tableDesc[col]) {
      await queryInterface.addColumn("support_tickets", col, def as never);
    }
  };

  await addIfMissing("ticket_number", {
    type: DataTypes.STRING(20),
    allowNull: true,
  });

  await addIfMissing("category", {
    type: DataTypes.ENUM(
      "loan_application",
      "payment",
      "technical",
      "document_upload",
      "general_inquiry",
      "school_verification",
      "disbursement",
      "other",
    ),
    allowNull: false,
    defaultValue: "general_inquiry",
  });

  await addIfMissing("cs_notes", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await addIfMissing("escalation_level", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await addIfMissing("escalated_to", {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "users", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await addIfMissing("escalation_note", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await addIfMissing("escalated_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addIfMissing("user_deleted_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.sequelize.query(`
    UPDATE support_tickets
    SET ticket_number = CONCAT('SC-', LPAD(FLOOR(RANDOM() * 90000 + 10000)::text, 5, '0'))
    WHERE ticket_number IS NULL
  `).catch(() => {});

  await queryInterface.changeColumn("support_tickets", "ticket_number", {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  }).catch(() => {});

  const indexes = await queryInterface.showIndex("support_tickets") as { name: string }[];
  const indexNames = indexes.map(i => i.name);

  if (!indexNames.includes("support_tickets_ticket_number")) {
    await queryInterface.addIndex("support_tickets", ["ticket_number"], { unique: true }).catch(() => {});
  }
  if (!indexNames.includes("support_tickets_category")) {
    await queryInterface.addIndex("support_tickets", ["category"]).catch(() => {});
  }
  if (!indexNames.includes("support_tickets_escalated_to")) {
    await queryInterface.addIndex("support_tickets", ["escalated_to"]).catch(() => {});
  }
  if (!indexNames.includes("support_tickets_user_deleted_at")) {
    await queryInterface.addIndex("support_tickets", ["user_deleted_at"]).catch(() => {});
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const cols = ["ticket_number", "category", "cs_notes", "escalation_level",
                "escalated_to", "escalation_note", "escalated_at", "user_deleted_at"];
  for (const col of cols) {
    await queryInterface.removeColumn("support_tickets", col).catch(() => {});
  }
};
