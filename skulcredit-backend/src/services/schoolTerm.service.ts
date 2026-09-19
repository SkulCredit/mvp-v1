import { Op } from "sequelize";
import SchoolTerm from "../models/SchoolTerm";
import ApiError from "../utils/apiError";

export interface TermPayload {
  name: string;
  academicYear: string;
  portalOpenDate: string;  // YYYY-MM-DD
  portalCloseDate: string; // YYYY-MM-DD
  maxTenorMonths: number;
  isActive?: boolean;
}

class SchoolTermService {
  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Find the currently active term by date (portal open ≤ today ≤ portal close).
   * Falls back to the term explicitly flagged isActive=true if none match by date.
   */
  async getActiveTerm() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Primary: date-based lookup
    const byDate = await SchoolTerm.findOne({
      where: {
        portalOpenDate:  { [Op.lte]: today },
        portalCloseDate: { [Op.gte]: today },
      },
      order: [["portalOpenDate", "DESC"]],
    });
    if (byDate) return byDate;

    // Fallback: admin-flagged active term
    return SchoolTerm.findOne({ where: { isActive: true } });
  }

  /**
   * Compute the effective max tenor for an application submitted today
   * within a given term. Per the owner's spec:
   *   - Applications in the first month of the term window → maxTenorMonths
   *   - Applications after that → maxTenorMonths - 1 (minimum 1)
   *
   * Example Term 1 (Sep–Oct, max 4):
   *   Sep applicant → 4 months
   *   Oct applicant → 3 months
   */
  computeEffectiveTenor(term: SchoolTerm): number {
    const today = new Date();
    const openDate = new Date(term.portalOpenDate);

    // Calculate months elapsed since portal opened
    const monthsElapsed =
      (today.getFullYear() - openDate.getFullYear()) * 12 +
      (today.getMonth() - openDate.getMonth());

    const effective = term.maxTenorMonths - monthsElapsed;
    return Math.max(1, Math.min(effective, term.maxTenorMonths));
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async listTerms() {
    return SchoolTerm.findAll({ order: [["portalOpenDate", "ASC"]] });
  }

  async getTerm(id: string) {
    const term = await SchoolTerm.findByPk(id);
    if (!term) throw new ApiError(404, "School term not found");
    return term;
  }

  async createTerm(payload: TermPayload) {
    const existing = await SchoolTerm.findOne({
      where: { name: payload.name, academicYear: payload.academicYear },
    });
    if (existing) {
      throw new ApiError(
        409,
        `Term "${payload.name}" for ${payload.academicYear} already exists`,
      );
    }

    if (new Date(payload.portalOpenDate) >= new Date(payload.portalCloseDate)) {
      throw new ApiError(400, "portalOpenDate must be before portalCloseDate");
    }

    // If activating, deactivate all others first
    if (payload.isActive) {
      await SchoolTerm.update({ isActive: false }, { where: {} });
    }

    return SchoolTerm.create({
      name:            payload.name,
      academicYear:    payload.academicYear,
      portalOpenDate:  payload.portalOpenDate,
      portalCloseDate: payload.portalCloseDate,
      maxTenorMonths:  payload.maxTenorMonths,
      isActive:        payload.isActive ?? false,
    });
  }

  async updateTerm(id: string, payload: Partial<TermPayload>) {
    const term = await SchoolTerm.findByPk(id);
    if (!term) throw new ApiError(404, "School term not found");

    if (
      payload.portalOpenDate &&
      payload.portalCloseDate &&
      new Date(payload.portalOpenDate) >= new Date(payload.portalCloseDate)
    ) {
      throw new ApiError(400, "portalOpenDate must be before portalCloseDate");
    }

    // If activating this term, deactivate all others
    if (payload.isActive === true) {
      await SchoolTerm.update(
        { isActive: false },
        { where: { id: { [Op.ne]: id } } },
      );
    }

    return term.update(payload);
  }

  async deleteTerm(id: string) {
    const term = await SchoolTerm.findByPk(id);
    if (!term) throw new ApiError(404, "School term not found");
    await term.destroy();
  }

  /**
   * Activate a specific term and deactivate all others in one call.
   * Convenience endpoint for the admin UI.
   */
  async activateTerm(id: string) {
    const term = await SchoolTerm.findByPk(id);
    if (!term) throw new ApiError(404, "School term not found");
    await SchoolTerm.update({ isActive: false }, { where: {} });
    return term.update({ isActive: true });
  }
}

export default new SchoolTermService();
