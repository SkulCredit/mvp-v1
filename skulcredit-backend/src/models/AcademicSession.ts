import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface AcademicSessionAttributes {
  id: string;
  sessionId: string;  
  sessionName: string;  
  startYear: number;
  endYear: number;
  isCurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type AcademicSessionCreationAttributes = Optional<
  AcademicSessionAttributes,
  "id" | "isCurrent"
>;

export class AcademicSessionInstance
  extends Model<AcademicSessionAttributes, AcademicSessionCreationAttributes>
  implements AcademicSessionAttributes
{
  declare id: string;
  declare sessionId: string;
  declare sessionName: string;
  declare startYear: number;
  declare endYear: number;
  declare isCurrent: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AcademicSessionInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    sessionName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    startYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    endYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "AcademicSession",
    tableName: "academic_sessions",
    timestamps: true,
    underscored: true,
  },
);

export default AcademicSessionInstance;
