import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  if (tables.includes("school_verification_links")) return;

  await queryInterface.createTable("school_verification_links", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    loan_application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "loan_applications", key: "id" },
      onDelete: "CASCADE",
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    generated_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM("confirmed", "rejected"),
      allowNull: true,
    },
    rejection_note: {
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

  await queryInterface.addIndex("school_verification_links", ["token"], { unique: true });
  await queryInterface.addIndex("school_verification_links", ["loan_application_id"]);
  await queryInterface.addIndex("school_verification_links", ["expires_at"]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("school_verification_links");
}
