import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

export interface RefreshTokenAttributes {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByToken: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  'id' | 'revokedAt' | 'replacedByToken'
>;

export class RefreshTokenInstance
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes {
  declare id: string;
  declare token: string;
  declare userId: string;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare replacedByToken: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get isExpired(): boolean {
    return Date.now() >= new Date(this.expiresAt).getTime();
  }

  get isActive(): boolean {
    return !this.revokedAt && !this.isExpired;
  }
}

RefreshTokenInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    expiresAt:       { type: DataTypes.DATE, allowNull: false },
    revokedAt:       { type: DataTypes.DATE, allowNull: true },
    replacedByToken: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
  }
);

export default RefreshTokenInstance;
