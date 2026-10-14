import { Op } from "sequelize";
import { ParentRepository } from "../repositories";
import { Student, LoanApplication, LoanLedger } from "../models/index";
import ApiError from "../utils/apiError";
import schoolTermService from "./schoolTerm.service";
import applicationService from "../integrations/lendsqr/application.service";
import { buildInitialStateMachine } from "../models/LoanLedger";
import { publishLoanBooking } from "../queues/loan.queue";
import type { BookLoanPayload } from "../integrations/lendsqr/application.service";
import logger from "../config/logger";
import env from "../config/env";

const LENDSQR_PRODUCT_ID = parseInt(process.env.LENDSQR_PRODUCT_ID ?? "74", 10);

interface SubmitApplicationData {
  studentId: string;
  amount: number;
  tenor: number;
}

class LoanService {
  async checkEligibility(userId: string, data: { amount: number }) {
    const parent = await ParentRepository.findOne({ userId });

    if (!parent?.lendsqrCustomerId) {
      throw new ApiError(
        400,
        "KYC not completed or Lendsqr customer not found",
      );
    }

    const response = (await applicationService.checkEligibility(
      parent.lendsqrCustomerId,
      data.amount,
    )) as { data: unknown };
    return response.data;
  }

  async submitApplication(userId: string, data: SubmitApplicationData) {
    const parent = await ParentRepository.findOne(
      { userId },
      // Need BVN for Lendsqr bookLoan — use the sensitive scope
      { scope: "withSensitive" } as never,
    );
    if (!parent) throw new ApiError(404, "Parent profile not found");

    if (!parent.lendsqrCustomerId) {
      throw new ApiError(
        400,
        "KYC not completed. Please complete your profile and KYC verification first.",
      );
    }

    const student = await Student.findByPk(data.studentId);
    if (!student || student.parentId !== parent.id) {
      throw new ApiError(400, "Invalid student record");
    }

    const activeTerm = await schoolTermService.getActiveTerm();
    if (activeTerm) {
      const existingApplication = await LoanApplication.findOne({
        where: {
          studentId: student.id,
          status: { [Op.notIn]: ["rejected", "cancelled"] },
          createdAt: {
            [Op.gte]: new Date(activeTerm.portalOpeningDate),
            [Op.lt]: new Date(
              new Date(activeTerm.portalCloseDate).getTime() +
                24 * 60 * 60 * 1000,
            ),
          },
        },
      });

      if (existingApplication) {
        throw new ApiError(
          409,
          `You've already submitted an application for ${student.firstName} ${student.lastName} this term (${activeTerm.termName} ${activeTerm.sessionName}). A student's fees can only be financed once per term.`,
        );
      }
    }

    const referenceNumber = `SKC-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const application = await LoanApplication.create({
      referenceNumber,
      parentId: parent.id,
      studentId: student.id,
      catalogSchoolId: student.schoolId,
      amountRequested: data.amount,
      tenor: data.tenor,
      status: "pending",
    });

    const now = new Date().toISOString();
    const stateMachine = buildInitialStateMachine(now);

    const ledger = await LoanLedger.create({
      loanApplicationId: application.id,
      lendsqrProductId: LENDSQR_PRODUCT_ID,
      bvnLast4: parent.bvn ? parent.bvn.slice(-4) : null,
      status: "INITIATED",
      stateMachine,
      statusHistory: [
        {
          status: "INITIATED",
          timestamp: now,
          actor: "SYSTEM",
          message: "Loan booking initiated",
        },
      ],
      settlement: {
        settledAt: null,
        settlementReference: null,
        status: "PENDING",
      },
      webhookPayloads: [],
      queuedAt: null,
    });

    // ── 3. Build Lendsqr bookLoan payload ─────────────────────────────────────
    //
    // BVN is required by Lendsqr.  The parent profile stores it encrypted;
    // we surface it here from the withSensitive scope.
    if (!parent.bvn) {
      logger.warn(
        `[loan.service] Parent ${parent.id} has no BVN on record — loan booking job skipped`,
      );
      // Application is still created; admin can retry once BVN is added
      return { application, ledger, queued: false };
    }

    const bookLoanPayload: BookLoanPayload = {
      bvn: parent.bvn,
      requested_amount: data.amount,
      proposed_tenor: data.tenor,
      proposed_tenor_period: "months",
      purpose: `School Fees for ${student.firstName} ${student.lastName}`,
      product_id: LENDSQR_PRODUCT_ID,
      disburse_to: "bank",
      location: (parent as unknown as Record<string, unknown>).addressState as
        | string
        | undefined,
    };

    await ledger.update({ queuedAt: new Date().toISOString() });

    await publishLoanBooking({
      loanApplicationId: application.id,
      loanLedgerId: ledger.id,
      bookLoanPayload,
    });

    logger.info(
      `[loan.service] Loan booking queued | application=${application.id} | ledger=${ledger.id}`,
    );

    return {
      application,
      ledger,
      referenceNumber,
      queued: true,
    };
  }
}

export default new LoanService();
