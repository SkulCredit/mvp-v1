import { QueryInterface, DataTypes, ModelAttributeColumnOptions } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableDescription = await queryInterface.describeTable("parents");

  // Helper: only add column if it doesn't already exist
  const addIfMissing = async (
    column: string,
    definition: ModelAttributeColumnOptions,
  ): Promise<void> => {
    if (!tableDescription[column]) {
      await queryInterface.addColumn("parents", column, definition);
    }
  };

  await addIfMissing("bank_account_number", {
    type: DataTypes.STRING(20),
    allowNull: true,
  });

  await addIfMissing("bank_code", {
    type: DataTypes.STRING(10),
    allowNull: true,
  });

  await addIfMissing("bvn_phone_number", {
    type: DataTypes.STRING(20),
    allowNull: true,
  });

  await addIfMissing("spouse_full_name", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await addIfMissing("spouse_email", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  await addIfMissing("spouse_phone", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  await addIfMissing("spouse_employer_type", {
    type: DataTypes.STRING(100),
    allowNull: true,
  });

  await addIfMissing("employer_name", {
    type: DataTypes.STRING(200),
    allowNull: true,
  });

  // --- students table ---
  const studentsDescription = await queryInterface.describeTable("students");

  if (!studentsDescription["dob"]) {
    await queryInterface.addColumn("students", "dob", {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });
  }

  if (!studentsDescription["gender"]) {
    await queryInterface.addColumn("students", "gender", {
      type: DataTypes.STRING(20),
      allowNull: true,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const parentCols = [
    "bank_account_number",
    "bank_code",
    "bvn_phone_number",
    "spouse_full_name",
    "spouse_email",
    "spouse_phone",
    "spouse_employer_type",
    "employer_name",
  ];
  for (const col of parentCols) {
    await queryInterface.removeColumn("parents", col);
  }
  await queryInterface.removeColumn("students", "dob");
  await queryInterface.removeColumn("students", "gender");
}
