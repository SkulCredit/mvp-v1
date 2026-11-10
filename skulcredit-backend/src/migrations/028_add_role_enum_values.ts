import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'risk_management'`,
  );
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'accountant'`,
  );
}

export async function down(): Promise<void> {
}
