import { Op } from "sequelize";
import AcademicTerm, {
  ApplicationWindow,
  TermCode,
  TermStatus,
} from "../models/AcademicTerm";
import AcademicSession from "../models/AcademicSession";
import ApiError from "../utils/apiError";

export interface ActiveTermResult {
  id: string;
  termId: string;
  termCode: TermCode;
  termName: string;
  sessionName: string; // e.g. "2026/2027"
  sessionId: string; // FK uuid
  maxRepaymentMonths: number;
  portalOpeningDate: string;
  portalCloseDate: string;
  applicationWindows: ApplicationWindow[];
  status: TermStatus;
}

export interface TermPayload {
  termId?: string;
  termCode: TermCode;
  termName: string;
  defaultResumptionMonth: string;
  maxRepaymentMonths: number;
  resumptionDate?: string | null;
  portalOpeningDate?: string | null;
  portalCloseDate?: string | null;
  status?: TermStatus;
  applicationWindows?: ApplicationWindow[];
}

export interface SessionPayload {
  sessionId?: string;
  sessionName: string; // "2026/2027"
  startYear: number;
  endYear: number;
  isCurrent?: boolean;
}

class SchoolTermService {
  private toActiveTermResult(
    term: AcademicTerm,
    sessionName: string,
  ): ActiveTermResult {
    return {
      id: term.id,
      termId: term.termId,
      termCode: term.termCode,
      termName: term.termName,
      sessionName,
      sessionId: term.sessionId,
      maxRepaymentMonths: term.maxRepaymentMonths,
      portalOpeningDate: term.portalOpeningDate ?? "",
      portalCloseDate: term.portalCloseDate ?? "",
      applicationWindows: term.applicationWindows ?? [],
      status: term.status,
    };
  }

  async getNextTerm(): Promise<ActiveTermResult | null> {
    const today = new Date().toISOString().split("T")[0];
    const term = await AcademicTerm.findOne({
      where: {
        portalOpeningDate: { [Op.gt]: today },
        status: { [Op.in]: ["UPCOMING", "ACTIVE_APPLICATION"] },
      },
      include: [
        { model: AcademicSession, as: "session", attributes: ["sessionName"] },
      ],
      order: [["portalOpeningDate", "ASC"]],
    });

    if (!term) return null;

    const sessionName =
      (term as AcademicTerm & { session?: { sessionName: string } }).session
        ?.sessionName ?? "";
    return this.toActiveTermResult(term, sessionName);
  }

  async getActiveTerm(): Promise<ActiveTermResult | null> {
    const today = new Date().toISOString().split("T")[0];
    const byDate = await AcademicTerm.findOne({
      where: {
        portalOpeningDate: { [Op.lte]: today },
        portalCloseDate: { [Op.gte]: today },
      },
      include: [
        { model: AcademicSession, as: "session", attributes: ["sessionName"] },
      ],
      order: [["portalOpeningDate", "DESC"]],
    });

    if (byDate) {
      const sessionName =
        (byDate as AcademicTerm & { session?: { sessionName: string } }).session
          ?.sessionName ?? "";
      return this.toActiveTermResult(byDate, sessionName);
    }

    const byFlag = await AcademicTerm.findOne({
      where: { status: "ACTIVE_APPLICATION" },
      include: [
        { model: AcademicSession, as: "session", attributes: ["sessionName"] },
      ],
    });

    if (byFlag) {
      const sessionName =
        (byFlag as AcademicTerm & { session?: { sessionName: string } }).session
          ?.sessionName ?? "";
      return this.toActiveTermResult(byFlag, sessionName);
    }

    return null;
  }

  computeEffectiveTenor(term: ActiveTermResult): number {
    const today = new Date().toISOString().split("T")[0];

    for (const win of term.applicationWindows) {
      if (today >= win.start_date && today <= win.end_date) {
        return win.repayment_duration_months;
      }
    }
    const durations = term.applicationWindows.map(
      (w) => w.repayment_duration_months,
    );
    return durations.length > 0 ? Math.min(...durations) : 1;
  }

  async listSessions() {
    return AcademicSession.findAll({
      include: [
        { model: AcademicTerm, as: "terms", order: [["termCode", "ASC"]] },
      ],
      order: [["startYear", "ASC"]],
    });
  }

  async getSession(id: string) {
    const session = await AcademicSession.findByPk(id, {
      include: [
        { model: AcademicTerm, as: "terms", order: [["termCode", "ASC"]] },
      ],
    });
    if (!session) throw new ApiError(404, "Academic session not found");
    return session;
  }

  async createSession(payload: SessionPayload) {
    const existing = await AcademicSession.findOne({
      where: { sessionName: payload.sessionName },
    });
    if (existing) {
      throw new ApiError(
        409,
        `Session "${payload.sessionName}" already exists`,
      );
    }

    if (payload.isCurrent) {
      await AcademicSession.update({ isCurrent: false }, { where: {} });
    }

    const sessionId =
      payload.sessionId ?? `SESS-${payload.startYear}-${payload.endYear}`;

    return AcademicSession.create({
      sessionId,
      sessionName: payload.sessionName,
      startYear: payload.startYear,
      endYear: payload.endYear,
      isCurrent: payload.isCurrent ?? false,
    });
  }

  async updateSession(id: string, payload: Partial<SessionPayload>) {
    const session = await AcademicSession.findByPk(id);
    if (!session) throw new ApiError(404, "Academic session not found");

    if (payload.isCurrent === true) {
      await AcademicSession.update(
        { isCurrent: false },
        { where: { id: { [Op.ne]: id } } },
      );
    }

    return session.update(payload);
  }

  async deleteSession(id: string) {
    const session = await AcademicSession.findByPk(id);
    if (!session) throw new ApiError(404, "Academic session not found");
    await session.destroy();
  }

  async setCurrentSession(id: string) {
    const session = await AcademicSession.findByPk(id);
    if (!session) throw new ApiError(404, "Academic session not found");
    await AcademicSession.update({ isCurrent: false }, { where: {} });
    return session.update({ isCurrent: true });
  }

  async listTerms(sessionId?: string) {
    const where = sessionId ? { sessionId } : {};
    return AcademicTerm.findAll({
      where,
      include: [
        { model: AcademicSession, as: "session", attributes: ["sessionName"] },
      ],
      order: [["portalOpeningDate", "ASC"]],
    });
  }

  async getTerm(id: string) {
    const term = await AcademicTerm.findByPk(id, {
      include: [
        { model: AcademicSession, as: "session", attributes: ["sessionName"] },
      ],
    });
    if (!term) throw new ApiError(404, "Academic term not found");
    return term;
  }

  async createTerm(sessionId: string, payload: TermPayload) {
    const session = await AcademicSession.findByPk(sessionId);
    if (!session) throw new ApiError(404, "Academic session not found");

    const existing = await AcademicTerm.findOne({
      where: { sessionId, termCode: payload.termCode },
    });
    if (existing) {
      throw new ApiError(
        409,
        `Term "${payload.termCode}" already exists for session "${session.sessionName}"`,
      );
    }

    const termId =
      payload.termId ??
      `TERM-${session.startYear}-${session.endYear}-${payload.termCode === "FIRST_TERM" ? "T1" : payload.termCode === "SECOND_TERM" ? "T2" : "T3"}`;

    return AcademicTerm.create({
      termId,
      sessionId,
      termCode: payload.termCode,
      termName: payload.termName,
      defaultResumptionMonth: payload.defaultResumptionMonth,
      maxRepaymentMonths: payload.maxRepaymentMonths,
      resumptionDate: payload.resumptionDate ?? null,
      portalOpeningDate: payload.portalOpeningDate ?? null,
      portalCloseDate: payload.portalCloseDate ?? null,
      status: payload.status ?? "UPCOMING",
      applicationWindows: payload.applicationWindows ?? [],
    });
  }

  async updateTerm(id: string, payload: Partial<TermPayload>) {
    const term = await AcademicTerm.findByPk(id);
    if (!term) throw new ApiError(404, "Academic term not found");

    if (payload.status === "ACTIVE_APPLICATION") {
      await AcademicTerm.update(
        { status: "APPLICATION_CLOSED" },
        {
          where: {
            id: { [Op.ne]: id },
            status: "ACTIVE_APPLICATION",
          },
        },
      );
    }

    return term.update(payload);
  }

  async deleteTerm(id: string) {
    const term = await AcademicTerm.findByPk(id);
    if (!term) throw new ApiError(404, "Academic term not found");
    await term.destroy();
  }

  async activateTerm(id: string) {
    const term = await AcademicTerm.findByPk(id);
    if (!term) throw new ApiError(404, "Academic term not found");
    await AcademicTerm.update(
      { status: "APPLICATION_CLOSED" },
      { where: { id: { [Op.ne]: id }, status: "ACTIVE_APPLICATION" } },
    );

    return term.update({ status: "ACTIVE_APPLICATION" });
  }

  async getCurrentTermForParent() {
    return this.getActiveTerm();
  }
}

export default new SchoolTermService();
