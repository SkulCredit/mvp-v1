/**
 * FundingPartnerDisbursementPage
 *
 * Public page — accessible directly from the funding partner's email link.
 * URL: /funding-partner/disbursement/:id
 *
 * Shows full application details and provides two actions:
 *   ✓ Disbursement Complete
 *   ✗ Reject Disbursement (requires a reason)
 *
 * Calls POST /schools/applications/:id/disbursement-callback (unauthenticated).
 */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

interface ApplicationDetail {
  id: string;
  referenceNumber: string | null;
  status: string;
  disbursementStatus: string;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  serviceChargeAmount: number | null;
  serviceChargeRate: number | null;
  serviceFeePaid: boolean;
  createdAt: string;
  student?: {
    firstName?: string;
    lastName?: string;
    studentId?: string | null;
    gradeLevel?: string;
  };
  parent?: {
    firstName?: string;
    lastName?: string;
  };
  catalogSchool?: {
    id?: string;
    name?: string;
    tier?: string | null;
    bankAccounts?: BankAccount[];
  };
  school?: {
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
  };
  schedule?: {
    installmentNumber: number;
    dueDate: string;
    totalAmount: number;
    outstandingBalance: number;
    status: string;
  }[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  isVerified: boolean;
}

const fmt = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function resolveBank(detail: ApplicationDetail) {
  const primary = detail.catalogSchool?.bankAccounts?.find((b) => b.isPrimary)
    ?? detail.catalogSchool?.bankAccounts?.[0];
  return {
    bankName: primary?.bankName ?? detail.school?.bankName ?? "Not provided",
    accountNumber: primary?.accountNumber ?? detail.school?.bankAccountNumber ?? "Not provided",
    accountName: primary?.accountName ?? detail.school?.bankAccountName ?? "Not provided",
    isVerified: primary?.isVerified ?? false,
  };
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({
  label,
  value,
  highlight = false,
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
    <span className={`text-sm font-semibold text-right break-all ${highlight ? "text-[#881337]" : "text-gray-900"}`}>
      {value}
    </span>
  </div>
);

const FundingPartnerDisbursementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  type ActionState = "idle" | "submitting" | "done_disbursed" | "done_rejected" | "error";
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  // Fetch application details via the public callback endpoint path
  // We use the parent applications endpoint — but it requires auth.
  // Instead, we expose a lightweight public read endpoint.
  // Since we don't have a public read endpoint, we call the
  // disbursement-callback URL to discover the app exists, OR
  // we fetch via GET /schools/applications/:id/disbursement-callback (not a GET)
  //
  // The cleanest solution: add a dedicated public GET endpoint.
  // For now we try the parent applications/:id endpoint — but it needs auth.
  // We call the unauthenticated GET /catalog/disbursement-details/:id endpoint
  // which we surface through the schools router.
  //
  // ACTUAL APPROACH: We added GET /schools/disbursement/:id as a public endpoint
  // in the backend that returns the full application read below.

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/schools/disbursement/${id}`)
      .then((res) => setDetail(res.data.data as ApplicationDetail))
      .catch(() => setLoadError("Failed to load funding request. The link may be expired or invalid."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDisbursed = async () => {
    if (!id) return;
    setActionState("submitting");
    setActionError("");
    try {
      await apiClient.post(`/schools/applications/${id}/disbursement-callback`, {
        action: "disbursed",
        note: "Disbursement confirmed by funding partner",
      });
      setActionState("done_disbursed");
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(
        axErr.response?.data?.message ?? "Disbursement confirmation failed. Please try again.",
      );
      setActionState("error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectReasonError("Please provide a reason for rejection.");
      return;
    }
    if (!id) return;
    setRejectReasonError("");
    setShowRejectModal(false);
    setActionState("submitting");
    setActionError("");
    try {
      await apiClient.post(`/schools/applications/${id}/disbursement-callback`, {
        action: "rejected",
        note: rejectReason.trim(),
      });
      setActionState("done_rejected");
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(
        axErr.response?.data?.message ?? "Failed to record rejection. Please try again.",
      );
      setActionState("error");
    }
  };

  const RejectModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
        <h3 id="reject-modal-title" className="text-lg font-bold text-gray-900 mb-2">Reject Disbursement</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please provide a clear reason. This will be recorded and the parent will be notified.
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectReasonError) setRejectReasonError("");
          }}
          placeholder="e.g. School bank account details could not be verified…"
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-colors"
        />
        {rejectReasonError && (
          <p className="mt-1 text-xs text-red-600 font-medium">{rejectReasonError}</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowRejectModal(false)}
            className="flex-1 rounded-full border-2 border-gray-200 text-gray-600 font-bold py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRejectSubmit}
            className="flex-1 rounded-full bg-red-600 text-white font-bold py-2.5 text-sm hover:bg-red-700 transition-colors shadow-sm"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#881337] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 px-8 py-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const bank = resolveBank(detail);
  const amountToDisburse = Number(detail.amountApproved ?? detail.amountRequested);
  const alreadyProcessed =
    detail.disbursementStatus === "successful" ||
    detail.disbursementStatus === "failed" ||
    actionState === "done_disbursed" ||
    actionState === "done_rejected";

  if (actionState === "done_disbursed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-3xl shadow-md border border-green-100 px-8 py-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Disbursement Confirmed</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Thank you. We've recorded the disbursement of <strong>{fmt(amountToDisburse)}</strong> for application{" "}
            <strong>{detail.referenceNumber ?? detail.id}</strong>. The parent has been notified.
          </p>
        </div>
      </div>
    );
  }

  if (actionState === "done_rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-3xl shadow-md border border-red-100 px-8 py-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Disbursement Rejected</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            The rejection has been recorded. The SkulCredit operations team and the parent have been notified.
          </p>
        </div>
      </div>
    );
  }

  if (detail.disbursementStatus === "successful") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-3xl shadow-md border border-green-100 px-8 py-10 text-center max-w-sm w-full">
          <p className="text-sm font-bold text-green-700">This disbursement has already been confirmed.</p>
          <p className="text-xs text-gray-400 mt-1">Reference: {detail.referenceNumber ?? detail.id}</p>
        </div>
      </div>
    );
  }

  if (detail.disbursementStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-3xl shadow-md border border-red-100 px-8 py-10 text-center max-w-sm w-full">
          <p className="text-sm font-bold text-red-700">This disbursement has already been rejected.</p>
          <p className="text-xs text-gray-400 mt-1">Reference: {detail.referenceNumber ?? detail.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 md:px-8">
      {showRejectModal && <RejectModal />}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              SkulCredit · Funding Request
            </p>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Disbursement Review
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Ref: <span className="font-mono font-bold">{detail.referenceNumber ?? detail.id}</span>
            </p>
          </div>
          <div className="shrink-0 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 capitalize">
            Pending Disbursement
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-2">
          <p className="text-xs font-bold text-[#881337] uppercase tracking-wide py-3 border-b border-gray-50">
            Application Details
          </p>
          <DetailRow label="Parent Name"
            value={`${detail.parent?.firstName ?? "—"} ${detail.parent?.lastName ?? ""}`.trim()} />
          <DetailRow label="Student Name"
            value={`${detail.student?.firstName ?? "—"} ${detail.student?.lastName ?? ""}`.trim()} />
          <DetailRow label="Admission No." value={detail.student?.studentId ?? "N/A"} />
          <DetailRow label="Grade / Level" value={detail.student?.gradeLevel ?? "N/A"} />
          <DetailRow label="School" value={detail.catalogSchool?.name ?? "N/A"} />
          <DetailRow label="School Tier"
            value={detail.catalogSchool?.tier ? `Tier ${detail.catalogSchool.tier}` : "N/A"} />
          <DetailRow label="Repayment Plan" value={`${detail.tenor}-month plan`} />
          <DetailRow label="Service Charge Paid"
            value={detail.serviceFeePaid ? (detail.serviceChargeAmount ? fmt(detail.serviceChargeAmount) : "Paid") : "Not paid"} />
          <DetailRow label="Amount to Disburse" value={fmt(amountToDisburse)} highlight />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-2">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-[#881337] uppercase tracking-wide">School Bank Account</p>
            {bank.isVerified && (
              <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          <DetailRow label="Bank Name" value={bank.bankName} />
          <DetailRow label="Account Number" value={bank.accountNumber} highlight />
          <DetailRow label="Account Name" value={bank.accountName} />
        </div>
        {(detail.schedule?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-bold text-[#881337] uppercase tracking-wide px-6 py-3 border-b border-gray-50">
              Parent Repayment Schedule
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-2.5 text-left text-xs text-gray-400 font-semibold uppercase">#</th>
                  <th className="px-6 py-2.5 text-left text-xs text-gray-400 font-semibold uppercase">Due Date</th>
                  <th className="px-6 py-2.5 text-right text-xs text-gray-400 font-semibold uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(detail.schedule ?? []).map((s) => (
                  <tr key={s.installmentNumber} className="border-t border-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-700">#{s.installmentNumber}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(s.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-[#881337]">{fmt(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {actionState === "error" && actionError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 font-medium">
            {actionError}
          </div>
        )}
        {!alreadyProcessed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6 space-y-4">
            <p className="text-sm font-bold text-gray-800">
              Transfer <span className="text-[#881337]">{fmt(amountToDisburse)}</span> to the school
              account above, then confirm below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDisbursed}
                disabled={actionState === "submitting"}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {actionState === "submitting" ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                Disbursement Complete
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={actionState === "submitting"}
                className="flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Reject Disbursement
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Once confirmed, this action cannot be undone. The parent will be notified immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingPartnerDisbursementPage;
