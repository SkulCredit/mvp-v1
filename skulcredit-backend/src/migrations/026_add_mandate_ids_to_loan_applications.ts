import { QueryInterface, DataTypes, ModelAttributeColumnOptions } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableDescription = await queryInterface.describeTable("loan_applications");

  const addIfMissing = async (
    column: string,
    definition: ModelAttributeColumnOptions,
  ): Promise<void> => {
    if (!tableDescription[column]) {
      await queryInterface.addColumn("loan_applications", column, definition);
    }
  };

  await addIfMissing("adjutor_mandate_id", {
    type: DataTypes.STRING(100),
    allowNull: true,
  });

  await addIfMissing("mandate_reference", {
    type: DataTypes.STRING(100),
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn("loan_applications", "mandate_reference");
  await queryInterface.removeColumn("loan_applications", "adjutor_mandate_id");
}
