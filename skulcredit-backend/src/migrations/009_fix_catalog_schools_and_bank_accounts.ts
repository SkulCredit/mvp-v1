import { QueryInterface, DataTypes } from "sequelize";


export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();

  if (tables.includes("catalog_schools")) {
    await queryInterface.sequelize.query(`
      UPDATE catalog_schools
      SET is_registered       = false,
          tier                = NULL,
          service_charge_rate = 0.2350
    `);

    await queryInterface.sequelize.query(`
      UPDATE catalog_schools
      SET is_registered       = true,
          tier                = '2',
          service_charge_rate = 0.1500
      WHERE name = 'Dothan Comprehensive Schools'
    `);
  }

  if (!tables.includes("school_bank_account_details")) {
    await queryInterface.createTable("school_bank_account_details", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      catalog_school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "catalog_schools", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      bank_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex(
      "school_bank_account_details",
      ["catalog_school_id"],
      { name: "school_bank_accounts_catalog_school_id_idx" },
    );
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("school_bank_account_details").catch(() => null);
};
