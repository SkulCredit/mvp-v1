import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { ApplicationEventActor } from '../types';

export interface ApplicationEventAttributes {
  id: string;
  loanApplicationId: string;
  actor: ApplicationEventActor;
  actorId: string | null;
  status: string;
  note: string | null;
  createdAt?: Date;
}

type ApplicationEventCreationAttributes = Optional<
  ApplicationEventAttributes,
  'id' | 'actorId' | 'note'
>;

export class ApplicationEventInstance
  extends Model<ApplicationEventAttributes, ApplicationEventCreationAttributes>
  implements ApplicationEventAttributes {
  declare id: string;
  declare loanApplicationId: string;
  declare actor: ApplicationEventActor;
  declare actorId: string | null;
  declare status: string;
  declare note: string | null;
  declare readonly createdAt: Date;
}

ApplicationEventInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanApplicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'loan_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
    actor: {
      type: DataTypes.ENUM('system', 'admin', 'parent', 'school'),
      allowNull: false,
      defaultValue: 'system',
    },
    actorId: { type: DataTypes.UUID, allowNull: true },
    status:  { type: DataTypes.STRING, allowNull: false },
    note:    { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'ApplicationEvent',
    tableName: 'application_events',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

export default ApplicationEventInstance;
