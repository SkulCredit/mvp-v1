/**
 * 012 — Backfill school_id and status on loan_applications
 *
 * When a parent submits an application for a school that is in our system
 * but has status != 'approved', the school_id was left NULL and the status
 * was set to 'pending' rather than 'school_verification'.
 *
 * This migration:
 *  1. Sets school_id for any application whose catalog school matches a
 *     schools record (any status).
 *  2. Advances the application status from 'pending' → 'school_verification'
 *     for those applications so the school can see and act on them.
 */
import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Step 1: fill in missing school_id via catalog_school → school name match
  await queryInterface.sequelize.query(`
    UPDATE loan_applications la
    SET school_id = s.id
    FROM schools s
    JOIN catalog_schools cs ON LOWER(cs.name) = LOWER(s.school_name)
    WHERE la.catalog_school_id = cs.id
      AND la.school_id IS NULL
  `);

  // Step 2: advance status to school_verification for pending apps
  //         that now have a matched school
  await queryInterface.sequelize.query(`
    UPDATE loan_applications
    SET status = 'school_verification'
    WHERE status = 'pending'
      AND school_id IS NOT NULL
  `);
};

export const down = async (_queryInterface: QueryInterface): Promise<void> => {
  // Not reversible — status changes and backfilled FKs are safe to keep
};
