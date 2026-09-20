import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

interface TermSeed {
  name: string;
  academicYear: string;
  portalOpenDate: string; 
  portalCloseDate: string;
  maxTenorMonths: number;
  isActive: boolean;
}

function buildDefaultTerms(): TermSeed[] {
  const now = new Date();
  const year = now.getFullYear();
  const ay = `${year}/${year + 1}`;

  return [
    {
      name: "Term 1",
      academicYear: ay,
      portalOpenDate:  `${year}-09-01`,
      portalCloseDate: `${year}-10-31`,  
      maxTenorMonths: 4,
      isActive: false, 
    },
    {
      name: "Term 2",
      academicYear: ay,
      portalOpenDate:  `${year + 1}-01-01`,
      portalCloseDate: `${year + 1}-02-28`, 
      maxTenorMonths: 4,
      isActive: false,
    },
    {
      name: "Term 3",
      academicYear: ay,
      portalOpenDate:  `${year + 1}-04-01`, 
      portalCloseDate: `${year + 1}-04-30`, 
      maxTenorMonths: 3,
      isActive: false,
    },
  ];
}

export async function seedSchoolTerms(): Promise<void> {
  const [existing] = await sequelize.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM school_terms",
    { type: QueryTypes.SELECT },
  );

  if (parseInt(existing.count, 10) > 0) {
    logger.info("School terms already seeded — skipping");
    return;
  }

  const terms = buildDefaultTerms();
  logger.info(`Seeding ${terms.length} default school terms for ${terms[0].academicYear}…`);

  for (const t of terms) {
    await sequelize.query(
      `INSERT INTO school_terms
         (id, name, academic_year, portal_open_date, portal_close_date,
          max_tenor_months, is_active, created_at, updated_at)
       VALUES
         (gen_random_uuid(), :name, :academicYear, :portalOpenDate, :portalCloseDate,
          :maxTenorMonths, :isActive, NOW(), NOW())
       ON CONFLICT (name, academic_year) DO NOTHING`,
      {
        replacements: {
          name:            t.name,
          academicYear:    t.academicYear,
          portalOpenDate:  t.portalOpenDate,
          portalCloseDate: t.portalCloseDate,
          maxTenorMonths:  t.maxTenorMonths,
          isActive:        t.isActive,
        },
        type: QueryTypes.INSERT,
      },
    );
  }

  logger.info("School terms seeded successfully");
}
