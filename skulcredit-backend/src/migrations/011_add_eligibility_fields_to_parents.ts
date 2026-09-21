import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("parents")) return;

  const cols = await queryInterface.describeTable("parents");

  if (!cols.relationship) {
    await queryInterface.addColumn("parents", "relationship", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!cols.employer_type) {
    await queryInterface.addColumn("parents", "employer_type", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!cols.years_in_role) {
    await queryInterface.addColumn("parents", "years_in_role", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!cols.monthly_income) {
    await queryInterface.addColumn("parents", "monthly_income", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!cols.eligibility_blocked_until) {
    await queryInterface.addColumn("parents", "eligibility_blocked_until", {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("parents")) return;

  const cols = await queryInterface.describeTable("parents");

  if (cols.relationship) await queryInterface.removeColumn("parents", "relationship");
  if (cols.employer_type) await queryInterface.removeColumn("parents", "employer_type");
  if (cols.years_in_role) await queryInterface.removeColumn("parents", "years_in_role");
  if (cols.monthly_income) await queryInterface.removeColumn("parents", "monthly_income");
  if (cols.eligibility_blocked_until) await queryInterface.removeColumn("parents", "eligibility_blocked_until");
};
