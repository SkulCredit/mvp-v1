import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface DeviceTokenAttributes {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt?: Date;
  updatedAt?: Date;
}

type DeviceTokenCreationAttributes = Optional<DeviceTokenAttributes, 'id'>;

export class DeviceTokenInstance
  extends Model<DeviceTokenAttributes, DeviceTokenCreationAttributes>
  implements DeviceTokenAttributes {
  declare id: string;
  declare userId: string;
  declare token: string;
  declare platform: 'ios' | 'android' | 'web';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DeviceTokenInstance.init(
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
    token: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android', 'web'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'DeviceToken',
    tableName: 'device_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token'], unique: true },
    ],
  }
);

export default DeviceTokenInstance;
