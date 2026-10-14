import { DataTypes, QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("funding_partner_contacts")) return;

  await queryInterface.createTable("funding_partner_contacts", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    funding_partner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "funding_partners", key: "id" },
      onDelete: "CASCADE",
    },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    position: { type: DataTypes.STRING, allowNull: true },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
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

  await queryInterface.addIndex("funding_partner_contacts", ["funding_partner_id"]);
  await queryInterface.addIndex("funding_partner_contacts", ["email"]);
  await queryInterface.addConstraint("funding_partner_contacts", {
    fields: ["email", "funding_partner_id"],
    type: "unique",
    name: "uq_fp_contact_email_partner",
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("funding_partner_contacts")) return;
  await queryInterface.dropTable("funding_partner_contacts");
};
