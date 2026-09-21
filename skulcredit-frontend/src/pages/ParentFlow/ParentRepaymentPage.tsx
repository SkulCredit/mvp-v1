import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  outstandingBalance: number;
  status: "upcoming" | "due" | "paid" | "partially_paid" | "overdue" | "waived";
  paidAt: string | null;
}

interface ApplicationSummary {
  id: string;
  referenceNumber: string | null;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  status: string;
  serviceFeePaid: boolean;
  serviceChargeAmount: number | null;
  disbursementStatus: string;
  student?: { firstName?: string; lastName?: string };
  catalogSchool?: { name?: string };
  schedule?: ScheduleInstallment[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
  "₦" +
  Number(n).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const STATUS_PILL: Record<
  ScheduleInstallment["status"],
  { bg: string; text: string; label: string }
> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-600", label: "Upcoming" },
  due: { bg: "bg-amber-50", text: "text-amber-600", label: "Due" },
  paid: { bg: "bg-green-50", text: "text-green-600", label: "Paid" },
  partially_paid: { bg: "bg-teal-50", text: "text-teal-600", label: "Partial" },
  overdue: { bg: "bg-red-50", text: "text-red-600", label: "Overdue" },
  waived: { bg: "bg-gray-50", text: "text-gray-500", label: "Waived" },
};

// ── Main Component ────────────────────────────────────────────────────────────

const ParentRepaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const applicationId = searchParams.get("applicationId");

  const [appData, setAppData] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(!!applicationId);
  const [loadError, setLoadError] = useState("");

  // "Confirm Repayment Setup" state
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Load application details when there's an applicationId in URL
  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    setLoadError("");
    (parentService.getApplicationDetails as (id: string) => Promise<unknown>)(
      applicationId,
    )
      .then((data) => {
        const d = data as ApplicationSummary & {
          schedule?: (ScheduleInstallment & { loanApplicationId?: string })[];
        };
        setAppData(d);
        // If schedule already exists, mark as confirmed
        if (d.schedule && d.schedule.length > 0) {
          setConfirmed(true);
        }
      })
      .catch(() =>
        setLoadError("Failed to load application details. Please refresh."),
      )
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleConfirm = useCallback(async () => {
    if (!applicationId) return;
    setConfirmError("");
    setConfirming(true);
    try {
      await parentService.setupRepayment(applicationId);
      setConfirmed(true);
      // Re-fetch to show the generated schedule
      const refreshed = await (
        parentService.getApplicationDetails as (id: string) => Promise<unknown>
      )(applicationId);
      setAppData(refreshed as ApplicationSummary);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setConfirmError(
        axErr.response?.data?.message ??
          (err as Error).message ??
          "Failed to confirm repayment plan. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  }, [applicationId]);

  // ── Empty state — no applicationId in URL ─────────────────────────────────
  if (!applicationId) {
    return (
      <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto pb-12">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Repayment</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            View and manage your active repayment schedules
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            No active repayment schedules
          </h3>
          <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
            Once an application is approved and disbursed, your repayment
            schedule will appear here.
          </p>
          <button
            type="button"
            onClick={() => navigate("/parent/applications")}
            className="mt-6 inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors"
          >
            View Applications
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-[90%] mx-auto pt-8">
        <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-5 text-red-700 text-sm font-medium">
          {loadError}
        </div>
      </div>
    );
  }

  if (!appData) return null;

  const totalAmount = Number(appData.amountApproved ?? appData.amountRequested);
  const hasSchedule = (appData.schedule?.length ?? 0) > 0;

  return (
    <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto pb-24">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/parent/applications")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover transition-colors group"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Applications
      </button>

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Setup Repayment Plan
        </h2>
        <p className="mt-0.5 text-sm text-gray-400">
          {appData.referenceNumber ?? appData.id} ·{" "}
          {appData.catalogSchool?.name ?? "—"}
        </p>
      </div>

      {/* Application Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 space-y-3">
        <p className="text-sm font-bold text-slate-700 mb-1">
          Application Summary
        </p>
        {[
          {
            label: "Student",
            value: appData.student
              ? `${appData.student.firstName ?? ""} ${appData.student.lastName ?? ""}`.trim()
              : "—",
          },
          { label: "School", value: appData.catalogSchool?.name ?? "—" },
          { label: "Tuition Amount", value: fmt(totalAmount) },
          {
            label: "Repayment Plan",
            value: `${appData.tenor}-month plan`,
          },
          {
            label: "Monthly Instalment",
            value: fmt(Math.round(totalAmount / appData.tenor)),
          },
          {
            label: "Service Charge",
            value: appData.serviceChargeAmount
              ? fmt(appData.serviceChargeAmount)
              : "—",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Repayment Schedule Table — shown after confirmation */}
      {hasSchedule && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">
              Your Repayment Schedule
            </p>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              {appData.tenor} installments
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Balance After
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(appData.schedule ?? []).map((s) => {
                  const pill = STATUS_PILL[s.status] ?? STATUS_PILL.upcoming;
                  const dueDateFmt = new Date(s.dueDate).toLocaleDateString(
                    "en-NG",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-700">
                        #{s.installmentNumber}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {dueDateFmt}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-brand">
                        {fmt(s.totalAmount)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500">
                        {fmt(s.outstandingBalance)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pill.bg} ${pill.text}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/60">
            <span className="text-sm font-semibold text-slate-600">
              Total Repayment
            </span>
            <span className="text-base font-extrabold text-brand">
              {fmt(totalAmount)}
            </span>
          </div>
        </div>
      )}

      {/* No-interest notice */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-3 flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">No interest applied.</span> SkulCredit
          does not charge interest on repayments. You repay exactly what was
          disbursed, spread over {appData.tenor} months.
        </p>
      </div>

      {/* Confirmation CTA */}
      {!confirmed && !hasSchedule && (
        <div className="bg-white rounded-2xl border border-brand/30 px-6 py-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-2">
            Confirm Your Repayment Plan
          </h3>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            By confirming, you agree to repay{" "}
            <strong>{fmt(totalAmount)}</strong> in{" "}
            <strong>{appData.tenor} equal monthly instalments</strong> of
            approximately{" "}
            <strong>{fmt(Math.round(totalAmount / appData.tenor))}</strong>{" "}
            each. This will also notify the funding partner to disburse fees to
            the school.
          </p>

          {confirmError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {confirmError}
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up…
              </>
            ) : (
              "Confirm & Complete Repayment Setup →"
            )}
          </button>
        </div>
      )}

      {/* Success state after confirmation */}
      {(confirmed || hasSchedule) && (
        <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">
              Repayment plan confirmed!
            </p>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              Your repayment schedule is set. The funding partner has been
              notified and will disburse the school fees shortly. You'll receive
              an email once disbursement is complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentRepaymentPage;
