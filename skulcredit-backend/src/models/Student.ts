import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface StudentAttributes {
  id: string;
  parentId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  gradeLevel: string;
  tuitionAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type StudentCreationAttributes = Optional<
  StudentAttributes,
  "id" | "studentId"
>;

export class StudentInstance
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes
{
  declare id: string;
  declare parentId: string;
  declare schoolId: string;
  declare firstName: string;
  declare lastName: string;
  declare studentId: string | null;
  declare gradeLevel: string;
  declare tuitionAmount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StudentInstance.init(
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
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "catalog_schools", key: "id" },
    },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    studentId: { type: DataTypes.STRING, allowNull: true },
    gradeLevel: { type: DataTypes.STRING, allowNull: false },
    tuitionAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  },
  {
    sequelize,
    modelName: "Student",
    tableName: "students",
    timestamps: true,
    underscored: true,
  },
);

export default StudentInstance;
