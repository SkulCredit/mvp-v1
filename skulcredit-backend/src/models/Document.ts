import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type DocumentCategory = "photo" | "kyc_document";

export interface DocumentAttributes {
  id: string;
  parentId: string;
  category: DocumentCategory;
  /** Human-readable label e.g. "Bank Statement (Last 3 Months)" */
  docType: string | null;
  /** Relative path on disk — e.g. "uploads/photos/uuid-photo.jpg" */
  filePath: string;
  /** Public-accessible URL derived from filePath — not stored, computed on read */
  fileUrl: string | null;
  /** MIME type e.g. "application/pdf" */
  mimeType: string | null;
  /** File size in bytes */
  fileSize: number | null;
  /** Lendsqr document type_id */
  lendsqrTypeId: number;
  /** Lendsqr document sub_type_id (optional) */
  lendsqrSubTypeId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DocumentCreationAttributes = Optional<
  DocumentAttributes,
  "id" | "docType" | "fileUrl" | "mimeType" | "fileSize" | "lendsqrSubTypeId"
>;

export class DocumentInstance
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  declare id: string;
  declare parentId: string;
  declare category: DocumentCategory;
  declare docType: string | null;
  declare filePath: string;
  declare fileUrl: string | null;
  declare mimeType: string | null;
  declare fileSize: number | null;
  declare lendsqrTypeId: number;
  declare lendsqrSubTypeId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DocumentInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "parents", key: "id" },
      onDelete: "CASCADE",
    },
    category: {
      type: DataTypes.ENUM("photo", "kyc_document"),
      allowNull: false,
    },
    docType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    fileUrl: {
      // Stored for convenience — can be regenerated from filePath + appUrl
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lendsqrTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    lendsqrSubTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    timestamps: true,
    underscored: true,
  },
);

export default DocumentInstance;
