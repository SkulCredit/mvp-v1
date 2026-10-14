import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();

  if (!tables.includes("parents")) return;

  if (tables.includes("documents")) return;

  await queryInterface.createTable("documents", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "parents", key: "id" },
      onDelete: "CASCADE",
    },
    category: {
      type: DataTypes.ENUM("photo", "kyc_document"),
      allowNull: false,
    },
    doc_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_path: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lendsqr_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    lendsqr_sub_type_id: {
      type: DataTypes.INTEGER,
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

  await queryInterface.addIndex("documents", ["parent_id"], {
    name: "documents_parent_id_idx",
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("documents");
};
