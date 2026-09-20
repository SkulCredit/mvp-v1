/**
 * Seeds the default Nigerian school term calendar into school_terms.
 * Safe to call on every boot — skips if rows already exist.
 *
 * Term windows (based on owner's spec):
 *   Term 1 — Sep 1 → Oct 31  (portal open, max 4 months, reduces to 3 in October)
 *   Term 2 — Jan 1 → Feb 28  (portal open, max 4 months, reduces to 3 in February)
 *   Term 3 — Apr 1 → Apr 30  (short term, max 3 months only)
 */

import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

interface TermSeed {
  name: string;
  academicYear: string;
  portalOpenDate: string;  // YYYY-MM-DD
  portalCloseDate: string; // YYYY-MM-DD
  maxTenorMonths: number;
  isActive: boolean;
}

function buildDefaultTerms(): TermSeed[] {
  const now = new Date();
  const year = now.getFullYear();

  // Academic year format: "2026/2027"
  // Term 1 is in the second half of `year`, Terms 2 & 3 are in `year+1`
  const ay = `${year}/${year + 1}`;

  return [
    {
      name: "Term 1",
      academicYear: ay,
      portalOpenDate:  `${year}-09-01`,   // September 1
      portalCloseDate: `${year}-10-31`,   // October 31 — window closes after Oct
      maxTenorMonths: 4,
      isActive: false, // seeder leaves activation to date-based logic / admin
    },
    {
      name: "Term 2",
      academicYear: ay,
      portalOpenDate:  `${year + 1}-01-01`, // January 1
      portalCloseDate: `${year + 1}-02-28`, // February 28
      maxTenorMonths: 4,
      isActive: false,
    },
    {
      name: "Term 3",
      academicYear: ay,
      portalOpenDate:  `${year + 1}-04-01`, // April 1
      portalCloseDate: `${year + 1}-04-30`, // April 30 — short term
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
