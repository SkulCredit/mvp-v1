
import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const existingTables = await queryInterface.showAllTables();

  if (!existingTables.includes("catalog_institution_types")) {
    await queryInterface.createTable("catalog_institution_types", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex("catalog_institution_types", ["name"], {
      name: "catalog_institution_types_name_idx",
      unique: true,
    });
  }

  if (!existingTables.includes("catalog_schools")) {
    await queryInterface.createTable("catalog_schools", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      is_registered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tier: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      service_charge_rate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("catalog_schools", ["is_registered"], {
      name: "catalog_schools_is_registered_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["tier"], {
      name: "catalog_schools_tier_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["is_active"], {
      name: "catalog_schools_is_active_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["name"], {
      name: "catalog_schools_name_idx",
    });
  }
  if (!existingTables.includes("catalog_school_class_levels")) {
    await queryInterface.createTable("catalog_school_class_levels", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "catalog_schools", key: "id" },
        onDelete: "CASCADE",
      },
      institution_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "catalog_institution_types", key: "id" },
        onDelete: "CASCADE",
      },
      sub_level_group: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      class_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
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
      "catalog_school_class_levels",
      ["school_id"],
      { name: "catalog_school_class_levels_school_id_idx" },
    );

    await queryInterface.addIndex(
      "catalog_school_class_levels",
      ["school_id", "institution_type_id"],
      { name: "catalog_school_class_levels_school_type_idx" },
    );
    await queryInterface.addIndex(
      "catalog_school_class_levels",
      ["institution_type_id"],
      { name: "catalog_school_class_levels_type_id_idx" },
    );
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("catalog_school_class_levels");
  await queryInterface.dropTable("catalog_schools");
  await queryInterface.dropTable("catalog_institution_types");
};
