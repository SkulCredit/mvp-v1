import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

const TIER_RATES: Record<string, number> = {
  "4": 0.2, // Tier 4  → 20 %
  "3": 0.2, // Tier 3  → 20 %
  "2": 0.15, // Tier 2  → 15 %
  "1": 0.125, // Tier 1  → 12.5 %
  "1+": 0.1, // Tier 1+ → 10 %
};

const NON_REGISTERED_RATE = 0.235; // 23.5 %

interface SubLevel {
  level: string;
  classes: string[];
}

interface InstitutionTypeEntry {
  type: string;
  classes?: string[];
  sub_levels?: SubLevel[];
}

interface SchoolEntry {
  institution_name: string;
  tier?: string | null;
  institution_types: InstitutionTypeEntry[];
}

interface FlatClassRow {
  sub_level_group: string | null;
  class_name: string;
}

/**
 * SCHOOLS — client-provided list (8 schools total).
 *
 * Per client spec (Term.md):
 *   - ONLY "Dothan Comprehensive Schools" is a registered school (tier = "2")
 *   - All other 7 schools are NON-REGISTERED (tier = null, rate = 23.5%)
 *
 * The tier field and isRegistered flag drive the service charge applied to
 * loan applications.  Do NOT add any school not on this list.
 */
const SCHOOLS: SchoolEntry[] = [
  {
    institution_name: "Gulf Flower Schools",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: ["Creche / Pre-age 1", "Pre-age 2", "Nursery I", "Nursery II"],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          { level: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] },
        ],
      },
    ],
  },
  {
    institution_name: "Foster Prime Schools",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: ["Creche / Toddler", "Playgroup", "Nursery I", "Nursery II"],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          { level: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] },
        ],
      },
    ],
  },
  {
    institution_name: "Dothan Comprehensive Schools",
    tier: "2", // REGISTERED — Tier 2 = 15% service charge
    institution_types: [
      {
        type: "Nursery",
        classes: [
          "Creche / Toddler",
          "Preparatory / Playgroup",
          "Nursery I",
          "Nursery II",
        ],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          { level: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] },
        ],
      },
    ],
  },
  {
    institution_name: "Stars International College",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: ["Creche / Toddler", "Pre-Nursery", "Nursery I", "Nursery II"],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          {
            level: "Senior Secondary",
            classes: [
              "SSS 1 (Science / Tech / Business / Humanities)",
              "SSS 2 (Science / Tech / Business / Humanities)",
              "SSS 3 (Science / Tech / Business / Humanities)",
            ],
          },
        ],
      },
    ],
  },
  {
    institution_name: "St. Jude's Private Schools",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: [
          "Creche / Playgroup",
          "Pre-Nursery",
          "Nursery I",
          "Nursery II",
        ],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          { level: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] },
        ],
      },
    ],
  },
  {
    institution_name: "Loral International Schools",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: ["Creche / Toddler", "Playgroup", "Nursery I", "Nursery II"],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: [
              "JSS 1 (Basic 7 / Year 7)",
              "JSS 2 (Basic 8 / Year 8)",
              "JSS 3 (Basic 9 / Year 9)",
            ],
          },
          {
            level: "Senior Secondary",
            classes: [
              "SSS 1 (Year 10 / IGCSE Foundation)",
              "SSS 2 (Year 11 / IGCSE)",
              "SSS 3 (Year 12 / SSCE)",
            ],
          },
        ],
      },
      {
        type: "Tertiary / Sixth Form",
        classes: [
          "Cambridge A-Level (Year 12 - Year 13)",
          "University Foundation Programme",
        ],
      },
    ],
  },
  {
    institution_name: "Gracewood International School",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: [
          "Creche / Playgroup",
          "Pre-Nursery",
          "Nursery I",
          "Nursery II",
        ],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
      {
        type: "Secondary",
        sub_levels: [
          {
            level: "Junior Secondary",
            classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"],
          },
          { level: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] },
        ],
      },
    ],
  },
  {
    institution_name: "Camilla Brook Place",
    tier: null, // non-registered
    institution_types: [
      {
        type: "Nursery",
        classes: [
          "Creche / Daycare",
          "Playgroup / Toddler",
          "Nursery I",
          "Nursery II",
        ],
      },
      {
        type: "Primary",
        classes: [
          "Basic I",
          "Basic II",
          "Basic III",
          "Basic IV",
          "Basic V",
          "Basic VI",
        ],
      },
    ],
  },
];

const PREFERRED_TYPE_ORDER = [
  "Nursery",
  "Primary",
  "Secondary",
  "Tertiary / Sixth Form",
];

function collectInstitutionTypes(schools: SchoolEntry[]): string[] {
  const seen = new Set<string>(PREFERRED_TYPE_ORDER);
  const order: string[] = [...PREFERRED_TYPE_ORDER];

  for (const school of schools) {
    for (const it of school.institution_types) {
      if (!seen.has(it.type)) {
        seen.add(it.type);
        order.push(it.type);
      }
    }
  }
  return order;
}

function flattenClasses(it: InstitutionTypeEntry): FlatClassRow[] {
  const rows: FlatClassRow[] = [];

  if (it.classes) {
    for (const cls of it.classes) {
      rows.push({ sub_level_group: null, class_name: cls });
    }
  }

  if (it.sub_levels) {
    for (const sl of it.sub_levels) {
      for (const cls of sl.classes) {
        rows.push({ sub_level_group: sl.level, class_name: cls });
      }
    }
  }

  return rows;
}

export async function seedCatalog(): Promise<void> {
  const [existing] = await sequelize.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM catalog_institution_types",
    { type: QueryTypes.SELECT },
  );

  if (parseInt(existing.count, 10) > 0) {
    logger.info("School catalog already seeded — skipping");
    return;
  }

  logger.info("Seeding school catalog…");

  const typeNames = collectInstitutionTypes(SCHOOLS);
  const typeIdMap = new Map<string, string>();

  for (let i = 0; i < typeNames.length; i++) {
    const name = typeNames[i];
    const [row] = await sequelize.query<{ id: string }>(
      `INSERT INTO catalog_institution_types (id, name, sort_order, created_at, updated_at)
       VALUES (gen_random_uuid(), :name, :sort_order, NOW(), NOW())
       RETURNING id`,
      { replacements: { name, sort_order: i }, type: QueryTypes.SELECT },
    );
    typeIdMap.set(name, row.id);
  }

  for (const school of SCHOOLS) {
    const tier = school.tier ?? null;
    const isRegistered = tier !== null;
    const rate = tier
      ? (TIER_RATES[tier] ?? NON_REGISTERED_RATE)
      : NON_REGISTERED_RATE;

    const [schoolRow] = await sequelize.query<{ id: string }>(
      `INSERT INTO catalog_schools
         (id, name, is_registered, tier, service_charge_rate, is_active, created_at, updated_at)
       VALUES
         (gen_random_uuid(), :name, :is_registered, :tier, :rate, true, NOW(), NOW())
       RETURNING id`,
      {
        replacements: {
          name: school.institution_name,
          is_registered: isRegistered,
          tier,
          rate,
        },
        type: QueryTypes.SELECT,
      },
    );

    const schoolId = schoolRow.id;

    for (const it of school.institution_types) {
      const typeId = typeIdMap.get(it.type);
      if (!typeId) continue;

      const classRows = flattenClasses(it);
      for (let sortOrder = 0; sortOrder < classRows.length; sortOrder++) {
        const { sub_level_group, class_name } = classRows[sortOrder];
        await sequelize.query(
          `INSERT INTO catalog_school_class_levels
             (id, school_id, institution_type_id, sub_level_group, class_name, sort_order, created_at, updated_at)
           VALUES
             (gen_random_uuid(), :school_id, :type_id, :sub_level_group, :class_name, :sort_order, NOW(), NOW())`,
          {
            replacements: {
              school_id: schoolId,
              type_id: typeId,
              sub_level_group,
              class_name,
              sort_order: sortOrder,
            },
            type: QueryTypes.INSERT,
          },
        );
      }
    }
  }

  logger.info(
    `School catalog seeded: ${typeNames.length} types, ${SCHOOLS.length} schools`,
  );
}
