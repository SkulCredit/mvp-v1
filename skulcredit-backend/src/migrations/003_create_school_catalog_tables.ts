/**
 * Migration 003 — School Catalog
 *
 * Creates three tables that power the parent eligibility form's
 * dependent dropdowns:
 *
 *   catalog_institution_types  — Nursery / Primary / Secondary / Tertiary …
 *   catalog_schools            — Each partner school (registered) or placeholder
 *                                for non-registered flow; holds tier + service-
 *                                charge data for registered schools.
 *   catalog_school_class_levels — The classes/levels that belong to a specific
 *                                 (school × institution_type) combination.
 *
 * Relationship chain (exactly mirrors the UI dependency):
 *   InstitutionType  ←  (school_id, institution_type_id)  →  ClassLevel
 *                                      ↑
 *                               CatalogSchool
 *
 * All three tables are idempotent — the migration is a no-op if the tables
 * already exist.
 */
import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const existingTables = await queryInterface.showAllTables();

  // ── 1. catalog_institution_types ─────────────────────────────────────────
  //
  //  Stores the distinct institution-type labels (Nursery, Primary, Secondary,
  //  Tertiary / Sixth Form …).  These are global — not per-school — so the
  //  parent sees them as the very first dropdown.
  // ─────────────────────────────────────────────────────────────────────────
  if (!existingTables.includes("catalog_institution_types")) {
    await queryInterface.createTable("catalog_institution_types", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        // e.g. "Nursery", "Primary", "Secondary", "Tertiary / Sixth Form"
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      sort_order: {
        // Controls display order in the dropdown (0 = first)
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex("catalog_institution_types", ["name"], {
      name: "catalog_institution_types_name_idx",
      unique: true,
    });
  }

  // ── 2. catalog_schools ────────────────────────────────────────────────────
  //
  //  One row per school that appears in the "Choose Student School" dropdown.
  //
  //  is_registered  — true  = Tier partner school (Tier 1+, 1, 2, 3, 4)
  //                   false = Non-registered school (flat 23.5 % service charge)
  //  tier           — NULL for non-registered schools
  //  service_charge_rate — stored as a decimal fraction, e.g. 0.10 = 10 %
  //                        Computed from tier on seed; NULL for non-registered
  //                        (use the global 0.235 fallback in business logic).
  // ─────────────────────────────────────────────────────────────────────────
  if (!existingTables.includes("catalog_schools")) {
    await queryInterface.createTable("catalog_schools", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      is_registered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tier: {
        // "1+", "1", "2", "3", "4"  — NULL for non-registered
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      service_charge_rate: {
        // Stored as decimal, e.g. 0.10, 0.125, 0.15, 0.20, 0.235
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex("catalog_schools", ["is_registered"], {
      name: "catalog_schools_is_registered_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["tier"], {
      name: "catalog_schools_tier_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["is_active"], {
      name: "catalog_schools_is_active_idx",
    });
    await queryInterface.addIndex("catalog_schools", ["name"], {
      name: "catalog_schools_name_idx",
    });
  }

  // ── 3. catalog_school_class_levels ────────────────────────────────────────
  //
  //  Stores the classes that belong to a given (school × institution_type).
  //  This is the leaf of the three-level selection chain.
  //
  //  sub_level_group — Optional grouping label used by Secondary schools to
  //                    separate "Junior Secondary" from "Senior Secondary"
  //                    within the same institution type.  NULL for flat lists.
  //  sort_order      — Controls display order within the (school × type) group.
  // ─────────────────────────────────────────────────────────────────────────
  if (!existingTables.includes("catalog_school_class_levels")) {
    await queryInterface.createTable("catalog_school_class_levels", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "catalog_schools", key: "id" },
        onDelete: "CASCADE",
      },
      institution_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "catalog_institution_types", key: "id" },
        onDelete: "CASCADE",
      },
      sub_level_group: {
        // e.g. "Junior Secondary", "Senior Secondary" — NULL when not needed
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      class_name: {
        // e.g. "JSS 1 (Basic 7)", "Nursery I", "SSS 1"
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Fast lookup: all classes for a given school
    await queryInterface.addIndex(
      "catalog_school_class_levels",
      ["school_id"],
      { name: "catalog_school_class_levels_school_id_idx" },
    );

    // Fast lookup: classes filtered by institution type (used by the endpoint)
    await queryInterface.addIndex(
      "catalog_school_class_levels",
      ["school_id", "institution_type_id"],
      { name: "catalog_school_class_levels_school_type_idx" },
    );

    // Fast lookup: all schools that offer a given institution type
    await queryInterface.addIndex(
      "catalog_school_class_levels",
      ["institution_type_id"],
      { name: "catalog_school_class_levels_type_id_idx" },
    );
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop in reverse FK dependency order
  await queryInterface.dropTable("catalog_school_class_levels");
  await queryInterface.dropTable("catalog_schools");
  await queryInterface.dropTable("catalog_institution_types");
};
