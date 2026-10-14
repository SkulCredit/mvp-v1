import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();

  if (!tables.includes("academic_sessions")) {
    await queryInterface.createTable("academic_sessions", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      session_id: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      session_name: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      start_year: { type: DataTypes.INTEGER, allowNull: false },
      end_year:   { type: DataTypes.INTEGER, allowNull: false },
      is_current: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }

  if (!tables.includes("academic_terms")) {
    await queryInterface.createTable("academic_terms", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      term_id: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "academic_sessions", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      term_code: {
        type: DataTypes.ENUM("FIRST_TERM", "SECOND_TERM", "THIRD_TERM"),
        allowNull: false,
      },
      term_name: { type: DataTypes.STRING(50), allowNull: false },
      default_resumption_month: { type: DataTypes.STRING(20), allowNull: false },
      max_repayment_months: { type: DataTypes.INTEGER, allowNull: false },
      resumption_date:    { type: DataTypes.DATEONLY, allowNull: true },
      portal_opening_date: { type: DataTypes.DATEONLY, allowNull: true },
      portal_close_date:   { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM(
          "UPCOMING",
          "ACTIVE_APPLICATION",
          "APPLICATION_CLOSED",
          "COMPLETED",
        ),
        allowNull: false,
        defaultValue: "UPCOMING",
      },
      application_windows: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: "[]",
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex("academic_terms", ["session_id", "term_code"], {
      unique: true,
      name: "academic_terms_session_id_term_code_unique",
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("academic_terms").catch(() => null);
  await queryInterface.dropTable("academic_sessions").catch(() => null);
  await queryInterface.sequelize
    .query('DROP TYPE IF EXISTS "enum_academic_terms_term_code"')
    .catch(() => null);
  await queryInterface.sequelize
    .query('DROP TYPE IF EXISTS "enum_academic_terms_status"')
    .catch(() => null);
};
