import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import type { NotificationType } from '../types';

export interface NotificationAttributes {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'type' | 'referenceId' | 'referenceType' | 'isRead' | 'readAt'
>;

export class NotificationInstance
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare title: string;
  declare message: string;
  declare type: NotificationType;
  declare referenceId: string | null;
  declare referenceType: string | null;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NotificationInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title:   { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'application_submitted', 'application_approved', 'application_rejected',
        'application_info_requested', 'disbursement_completed', 'disbursement_failed',
        'payment_received', 'payment_overdue', 'school_approved', 'school_rejected',
        'account_action', 'general'
      ),
      defaultValue: 'general',
    },
    referenceId:   { type: DataTypes.UUID, allowNull: true },
    referenceType: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
  }
);

export default NotificationInstance;
