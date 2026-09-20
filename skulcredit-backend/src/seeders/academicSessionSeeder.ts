/**
 * src/seeders/academicSessionSeeder.ts
 *
 * Seeds academic_sessions and academic_terms from 2026/2027 → 2035/2036.
 * Safe to call on every boot — skips if data already exists (idempotent).
 *
 * Data based on Term.md spec:
 *   First Term  — Sep resumption, portal Sep 1–Oct 31, max 4 months
 *   Second Term — Jan resumption, portal Jan 1–Feb 28/29, max 4 months
 *   Third Term  — Apr resumption, portal Apr 1–Apr 30, max 3 months
 *
 * Each term has two application windows:
 *   - Early window (month 1):  full max_repayment_months
 *   - Late window  (month 2):  max_repayment_months - 1
 */

import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import logger from "../config/logger";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppWindow {
  window_name: string;
  start_date: string;
  end_date: string;
  repayment_duration_months: number;
  is_open: boolean;
}

interface TermData {
  term_id: string;
  term_code: "FIRST_TERM" | "SECOND_TERM" | "THIRD_TERM";
  term_name: string;
  default_resumption_month: string;
  max_repayment_months: number;
  resumption_date: string;
  portal_opening_date: string;
  portal_close_date: string;
  status: "UPCOMING" | "ACTIVE_APPLICATION" | "APPLICATION_CLOSED" | "COMPLETED";
  application_windows: AppWindow[];
}

interface SessionData {
  session_id: string;
  session_name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  terms: TermData[];
}

// ── Resumption dates from Term.md ─────────────────────────────────────────────

const RESUMPTION_DATES: Record<string, { t1: string; t2: string; t3: string }> = {
  "2026/2027": { t1: "2026-09-14", t2: "2027-01-11", t3: "2027-04-26" },
  "2027/2028": { t1: "2027-09-13", t2: "2028-01-10", t3: "2028-04-24" },
  "2028/2029": { t1: "2028-09-11", t2: "2029-01-08", t3: "2029-04-23" },
  "2029/2030": { t1: "2029-09-10", t2: "2030-01-07", t3: "2030-04-22" },
  "2030/2031": { t1: "2030-09-09", t2: "2031-01-06", t3: "2031-04-28" },
  "2031/2032": { t1: "2031-09-15", t2: "2032-01-12", t3: "2032-04-26" },
  "2032/2033": { t1: "2032-09-13", t2: "2033-01-10", t3: "2033-04-25" },
  "2033/2034": { t1: "2033-09-12", t2: "2034-01-09", t3: "2034-04-24" },
  "2034/2035": { t1: "2034-09-11", t2: "2035-01-08", t3: "2035-04-23" },
  "2035/2036": { t1: "2035-09-10", t2: "2036-01-07", t3: "2036-04-28" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the last day of February for a given year (handles leap years) */
function febEnd(year: number): string {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return `${year}-02-${isLeap ? "29" : "28"}`;
}

function computeStatus(portalOpen: string, portalClose: string): TermData["status"] {
  const today = new Date().toISOString().split("T")[0];
  if (today < portalOpen) return "UPCOMING";
  if (today >= portalOpen && today <= portalClose) return "ACTIVE_APPLICATION";
  return "APPLICATION_CLOSED";
}

// ── Session builder ───────────────────────────────────────────────────────────

function buildSession(startYear: number, isCurrent: boolean): SessionData {
  const endYear = startYear + 1;
  const sessionName = `${startYear}/${endYear}`;
  const sessionId = `SESS-${startYear}-${endYear}`;
  const dates = RESUMPTION_DATES[sessionName];

  // ── First Term: Sep 1 → Oct 31 ─────────────────────────────────────────
  const t1Open  = `${startYear}-09-01`;
  const t1Close = `${startYear}-10-31`;
  const term1: TermData = {
    term_id:                `TERM-${startYear}-${endYear}-T1`,
    term_code:              "FIRST_TERM",
    term_name:              "First Term",
    default_resumption_month: "September",
    max_repayment_months:   4,
    resumption_date:        dates.t1,
    portal_opening_date:    t1Open,
    portal_close_date:      t1Close,
    status:                 computeStatus(t1Open, t1Close),
    application_windows: [
      {
        window_name:                "Early Applicant Window",
        start_date:                 `${startYear}-09-01`,
        end_date:                   `${startYear}-09-30`,
        repayment_duration_months:  4,
        is_open:                    computeStatus(`${startYear}-09-01`, `${startYear}-09-30`) === "ACTIVE_APPLICATION",
      },
      {
        window_name:                "Late Applicant Window",
        start_date:                 `${startYear}-10-01`,
        end_date:                   `${startYear}-10-31`,
        repayment_duration_months:  3,
        is_open:                    computeStatus(`${startYear}-10-01`, `${startYear}-10-31`) === "ACTIVE_APPLICATION",
      },
    ],
  };

  // ── Second Term: Jan 1 → Feb 28/29 ────────────────────────────────────
  const t2Open  = `${endYear}-01-01`;
  const t2Close = febEnd(endYear);
  const term2: TermData = {
    term_id:                `TERM-${startYear}-${endYear}-T2`,
    term_code:              "SECOND_TERM",
    term_name:              "Second Term",
    default_resumption_month: "January",
    max_repayment_months:   4,
    resumption_date:        dates.t2,
    portal_opening_date:    t2Open,
    portal_close_date:      t2Close,
    status:                 computeStatus(t2Open, t2Close),
    application_windows: [
      {
        window_name:                "Early Applicant Window",
        start_date:                 `${endYear}-01-01`,
        end_date:                   `${endYear}-01-31`,
        repayment_duration_months:  4,
        is_open:                    computeStatus(`${endYear}-01-01`, `${endYear}-01-31`) === "ACTIVE_APPLICATION",
      },
      {
        window_name:                "Late Applicant Window",
        start_date:                 `${endYear}-02-01`,
        end_date:                   febEnd(endYear),
        repayment_duration_months:  3,
        is_open:                    computeStatus(`${endYear}-02-01`, febEnd(endYear)) === "ACTIVE_APPLICATION",
      },
    ],
  };

  // ── Third Term: Apr 1 → May 31  (short — max 3 months) ────────────────
  const t3Open  = `${endYear}-04-01`;
  const t3Close = `${endYear}-05-31`;
  const term3: TermData = {
    term_id:                `TERM-${startYear}-${endYear}-T3`,
    term_code:              "THIRD_TERM",
    term_name:              "Third Term",
    default_resumption_month: "April",
    max_repayment_months:   3,
    resumption_date:        dates.t3,
    portal_opening_date:    t3Open,
    portal_close_date:      t3Close,
    status:                 computeStatus(t3Open, t3Close),
    application_windows: [
      {
        window_name:                "Standard Applicant Window",
        start_date:                 `${endYear}-04-01`,
        end_date:                   `${endYear}-04-30`,
        repayment_duration_months:  3,
        is_open:                    computeStatus(`${endYear}-04-01`, `${endYear}-04-30`) === "ACTIVE_APPLICATION",
      },
      {
        window_name:                "Late Applicant Window",
        start_date:                 `${endYear}-05-01`,
        end_date:                   `${endYear}-05-31`,
        repayment_duration_months:  2,
        is_open:                    computeStatus(`${endYear}-05-01`, `${endYear}-05-31`) === "ACTIVE_APPLICATION",
      },
    ],
  };

  return {
    session_id:   sessionId,
    session_name: sessionName,
    start_year:   startYear,
    end_year:     endYear,
    is_current:   isCurrent,
    terms: [term1, term2, term3],
  };
}

// ── All sessions 2026/2027 → 2035/2036 ───────────────────────────────────────

function buildAllSessions(): SessionData[] {
  const currentYear = new Date().getFullYear();
  // Current session = the one whose start_year is currentYear (or currentYear-1 if before Sep)
  const currentStartYear = new Date().getMonth() >= 8 ? currentYear : currentYear - 1;

  return [
    2026, 2027, 2028, 2029, 2030,
    2031, 2032, 2033, 2034, 2035,
  ].map((y) => buildSession(y, y === currentStartYear));
}

// ── Exported seeder ───────────────────────────────────────────────────────────

export async function seedAcademicSessions(): Promise<void> {
  // Idempotency guard
  const [existing] = await sequelize.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM academic_sessions",
    { type: QueryTypes.SELECT },
  );

  if (parseInt(existing.count, 10) > 0) {
    logger.info("Academic sessions already seeded — skipping");
    return;
  }

  const sessions = buildAllSessions();
  logger.info(`Seeding ${sessions.length} academic sessions (${sessions.length * 3} terms total)…`);

  for (const session of sessions) {
    // Insert session row
    const [sessionRow] = await sequelize.query<{ id: string }>(
      `INSERT INTO academic_sessions
         (id, session_id, session_name, start_year, end_year, is_current, created_at, updated_at)
       VALUES
         (gen_random_uuid(), :sessionId, :sessionName, :startYear, :endYear, :isCurrent, NOW(), NOW())
       ON CONFLICT (session_id) DO NOTHING
       RETURNING id`,
      {
        replacements: {
          sessionId:   session.session_id,
          sessionName: session.session_name,
          startYear:   session.start_year,
          endYear:     session.end_year,
          isCurrent:   session.is_current,
        },
        type: QueryTypes.SELECT,
      },
    );

    if (!sessionRow) continue; // already existed — skip terms too
    const sessionPkId = sessionRow.id;

    for (const term of session.terms) {
      await sequelize.query(
        `INSERT INTO academic_terms
           (id, term_id, session_id, term_code, term_name,
            default_resumption_month, max_repayment_months,
            resumption_date, portal_opening_date, portal_close_date,
            status, application_windows, created_at, updated_at)
         VALUES
           (gen_random_uuid(), :termId, :sessionId, :termCode, :termName,
            :defaultResumptionMonth, :maxRepaymentMonths,
            :resumptionDate, :portalOpeningDate, :portalCloseDate,
            :status, :applicationWindows::jsonb, NOW(), NOW())
         ON CONFLICT (term_id) DO NOTHING`,
        {
          replacements: {
            termId:                  term.term_id,
            sessionId:               sessionPkId,
            termCode:                term.term_code,
            termName:                term.term_name,
            defaultResumptionMonth:  term.default_resumption_month,
            maxRepaymentMonths:      term.max_repayment_months,
            resumptionDate:          term.resumption_date,
            portalOpeningDate:       term.portal_opening_date,
            portalCloseDate:         term.portal_close_date,
            status:                  term.status,
            applicationWindows:      JSON.stringify(term.application_windows),
          },
          type: QueryTypes.INSERT,
        },
      );
    }
  }

  logger.info("Academic sessions and terms seeded successfully");
}
