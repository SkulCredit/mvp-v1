import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";
import { paymentService } from "../../services/paymentService";
import { AxiosError } from "axios";
import Pagination from "../../components/ui/Pagination";

type InstallmentStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "waived";

type MandateStatus = "not_set" | "pending" | "active" | "failed" | "cancelled";

interface ScheduleInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  totalAmount: number;
  principalAmount: number;
  outstandingBalance: number;
  status: InstallmentStatus;
  paidAt: string | null;
  amountPaid: number | null;
}

interface ApplicationData {
  id: string;
  referenceNumber: string | null;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  status: string;
  serviceFeePaid: boolean;
  serviceChargeAmount: number | null;
  disbursementStatus: string;
  mandateDebitDay: number | null;
  mandateStatus: MandateStatus;
  student?: { firstName?: string; lastName?: string; gradeLevel?: string };
  catalogSchool?: { name?: string };
  schedule?: ScheduleInstallment[];
}

const fmt = (n: number | string) =>
  "₦" +
  Number(n).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const PLAN_META: Record<
  number,
  { label: string; tagline: string; badge?: string }
> = {
  2: {
    label: "2-Month Plan",
    tagline: "A shorter plan with higher monthly payments.",
    badge: "Best for those who want to clear their debt quickly.",
  },
  3: {
    label: "3-Month Plan",
    tagline: "A shorter option with higher monthly payments.",
    badge: "Best for those who want to clear their debt quickly.",
  },
  4: {
    label: "4-Month Plan",
    tagline: "A balanced option with manageable monthly payments.",
    badge: "Good balance of affordability and time.",
  },
  6: {
    label: "6-Month Plan",
    tagline: "Lower monthly payments for more flexibility.",
    badge: "Ideal if you need more time to repay.",
  },
};

const ALL_PLAN_TENORS = [2, 3, 4];

type DashboardApp = {
  id: string;
  referenceNumber: string | null;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  status: string;
  student?: { firstName?: string; lastName?: string };
  catalogSchool?: { name?: string };
  schedule?: ScheduleInstallment[];
};

const STATUS_PILL: Record<
  InstallmentStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  upcoming: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-500",
    label: "Upcoming",
  },
  due: {
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    dot: "bg-yellow-700",
    label: "Due Now",
  },
  paid: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Paid",
  },
  partially_paid: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    dot: "bg-teal-400",
    label: "Partial",
  },
  overdue: {
    bg: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Overdue",
  },
  waived: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    dot: "bg-gray-300",
    label: "Waived",
  },
};

const REPAY_PAGE_SIZE_OPTIONS = [10, 30, 50, 100, 500] as const;
type RepayPageSizeOption = (typeof REPAY_PAGE_SIZE_OPTIONS)[number];

const RepaymentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [apps, setApps] = useState<DashboardApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repayPage, setRepayPage] = useState(1);
  const [repayLimit, setRepayLimit] = useState<RepayPageSizeOption>(10);
  const [repaySearch, setRepaySearch] = useState("");

  const [modal, setModal] = useState<{
    appId: string;
    mode: "month" | "liquidate";
    schedule: ScheduleInstallment[];
    totalAmount: number;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    setLoading(true);
    (
      parentService.getApplications as (
        p: number,
        l: number,
      ) => Promise<unknown>
    )(1, 100)
      .then(async (raw) => {
        const d = raw as { applications?: DashboardApp[] };
        const allApps: DashboardApp[] = Array.isArray(raw)
          ? (raw as DashboardApp[])
          : (d.applications ?? []);
        const list = allApps.filter(
          (a) =>
            a.status === "disbursed" ||
            a.status === "approved" ||
            a.status === "repaid",
        );
        const withSchedules = await Promise.all(
          list.map(async (a) => {
            try {
              const detail = await (
                parentService.getRepaymentSchedule as (
                  id: string,
                ) => Promise<unknown>
              )(a.id);
              return detail as DashboardApp;
            } catch {
              return a;
            }
          }),
        );
        setApps(withSchedules.filter((a) => (a.schedule?.length ?? 0) > 0));
      })
      .catch(() =>
        setLoadError("Failed to load repayment data. Please refresh."),
      )
      .finally(() => setLoading(false));
  }, []);

  const openModal = (app: DashboardApp, mode: "month" | "liquidate") => {
    const total = Number(app.amountApproved ?? app.amountRequested);
    setSelectedIds(
      mode === "liquidate"
        ? (app.schedule ?? [])
            .filter((s) => s.status !== "paid" && s.status !== "waived")
            .map((s) => s.id)
        : [],
    );
    setPayError("");
    setModal({
      appId: app.id,
      mode,
      schedule: app.schedule ?? [],
      totalAmount: total,
    });
  };

  const handlePay = () => {
    if (!modal || selectedIds.length === 0) return;
    const selSchedules = modal.schedule.filter((s) =>
      selectedIds.includes(s.id),
    );
    const amount = selSchedules.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );
    const type =
      modal.mode === "liquidate"
        ? "early_full"
        : selectedIds.length > 1
          ? "early_partial"
          : "scheduled";
    const params = new URLSearchParams({
      applicationId: modal.appId,
      scheduleIds: selectedIds.join(","),
      type,
      amount: String(amount),
    });
    navigate(`/parent/repayment-pay?${params.toString()}`);
  };

  const fmtAmt = (n: number | string) =>
    "₦" +
    Number(n).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pt-8">
        <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-5 text-red-700 text-sm font-medium">
          {loadError}
        </div>
      </div>
    );
  }

  const modalSchedule = modal?.schedule ?? [];
  const unpaid = modalSchedule.filter(
    (s) => s.status !== "paid" && s.status !== "waived",
  );
  const selectedTotal = modalSchedule
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="w-full pt-6 pb-24 space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Repayment</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage and clear your active tuition repayments.
        </p>
      </div>

      {(() => {
        const q = repaySearch.trim().toLowerCase();
        const filteredApps = q
          ? apps.filter((a) => {
              const name =
                `${a.student?.firstName ?? ""} ${a.student?.lastName ?? ""}`.toLowerCase();
              const school = (a.catalogSchool?.name ?? "").toLowerCase();
              const ref = (a.referenceNumber ?? "").toLowerCase();
              return name.includes(q) || school.includes(q) || ref.includes(q);
            })
          : apps;
        const totalRepay = filteredApps.length;
        const totalRepayPages = Math.ceil(totalRepay / repayLimit);
        const pagedApps = filteredApps.slice(
          (repayPage - 1) * repayLimit,
          repayPage * repayLimit,
        );

        return (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={repaySearch}
                  onChange={(e) => {
                    setRepaySearch(e.target.value);
                    setRepayPage(1);
                  }}
                  placeholder="Search by student, school, or reference..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label
                  htmlFor="repay-page-size"
                  className="text-xs text-slate-500 whitespace-nowrap"
                >
                  Show
                </label>
                <select
                  id="repay-page-size"
                  value={repayLimit}
                  onChange={(e) => {
                    setRepayLimit(
                      Number(e.target.value) as RepayPageSizeOption,
                    );
                    setRepayPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none cursor-pointer"
                >
                  {REPAY_PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  per page
                </span>
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-20 px-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7"
                    aria-hidden="true"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-700">
                  {repaySearch
                    ? "No matching repayments"
                    : "No active repayments"}
                </h3>
                <p className="text-slate-500 mt-1.5 text-sm max-w-xs mx-auto">
                  {repaySearch
                    ? "Try adjusting your search term."
                    : "Once an application is disbursed, your repayment schedule will appear here."}
                </p>
                {!repaySearch && (
                  <button
                    type="button"
                    onClick={() => navigate("/parent/applications")}
                    className="mt-5 inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors"
                  >
                    View Applications
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {pagedApps.map((app) => {
                  const total = Number(
                    app.amountApproved ?? app.amountRequested,
                  );
                  const paidAmt = (app.schedule ?? []).reduce(
                    (s, r) => s + Number(r.amountPaid ?? 0),
                    0,
                  );
                  const paidCount = (app.schedule ?? []).filter(
                    (s) => s.status === "paid" || s.status === "waived",
                  ).length;
                  const totalInstall = app.schedule?.length ?? 0;
                  const paidPct =
                    total > 0 ? Math.round((paidAmt / total) * 100) : 0;
                  const remaining = total - paidAmt;
                  const hasOverdue = (app.schedule ?? []).some(
                    (s) => s.status === "overdue",
                  );
                  const allPaid =
                    paidCount === totalInstall && totalInstall > 0;
                  const isExpanded = expandedId === app.id;
                  const studentName = app.student
                    ? `${app.student.firstName ?? ""} ${app.student.lastName ?? ""}`.trim()
                    : "—";

                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0">
                              {studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {studentName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {app.catalogSchool?.name ?? "—"} ·{" "}
                                {app.referenceNumber ?? app.id.slice(0, 12)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {hasOverdue && (
                              <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
                                Overdue
                              </span>
                            )}
                            {allPaid && (
                              <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full">
                                Fully Paid
                              </span>
                            )}
                            {!allPaid && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openModal(app, "month")}
                                  className="text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-xl hover:bg-brand-hover transition-colors"
                                >
                                  Pay Month
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openModal(app, "liquidate")}
                                  className="text-xs font-bold border border-brand text-brand px-3 py-1.5 rounded-xl hover:bg-brand/5 transition-colors"
                                >
                                  Clear All
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : app.id)
                              }
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">
                              Total
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                              {fmtAmt(total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">
                              Paid
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              {fmtAmt(paidAmt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">
                              Remaining
                            </p>
                            <p className="text-sm font-bold text-brand">
                              {fmtAmt(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                            <span>
                              {paidCount} of {totalInstall} paid
                            </span>
                            <span className="font-semibold text-brand">
                              {paidPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand transition-all duration-500"
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100">
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                  {["#", "Due Date", "Amount", "Status"].map(
                                    (h, i) => (
                                      <th
                                        key={h}
                                        className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${i < 2 ? "text-left" : i === 3 ? "text-center" : "text-right"}`}
                                      >
                                        {h}
                                      </th>
                                    ),
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {(app.schedule ?? []).map((s, idx) => {
                                  const pill =
                                    STATUS_PILL[s.status] ??
                                    STATUS_PILL.upcoming;
                                  const isLast =
                                    idx === (app.schedule?.length ?? 0) - 1;
                                  return (
                                    <tr
                                      key={s.id}
                                      className={`${!isLast ? "border-b border-slate-50" : ""} hover:bg-slate-50/50`}
                                    >
                                      <td className="px-5 py-3 text-slate-500 text-sm">
                                        {s.installmentNumber}
                                      </td>
                                      <td className="px-5 py-3 text-slate-700 text-sm">
                                        {fmtDate(s.dueDate)}
                                      </td>
                                      <td className="px-5 py-3 text-right font-semibold text-slate-800 text-sm">
                                        {fmtAmt(s.totalAmount)}
                                      </td>
                                      <td className="px-5 py-3 text-center">
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${pill.bg} ${pill.text}`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${pill.dot}`}
                                          />
                                          {pill.label}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="md:hidden divide-y divide-slate-100">
                            {(app.schedule ?? []).map((s) => {
                              const pill =
                                STATUS_PILL[s.status] ?? STATUS_PILL.upcoming;
                              return (
                                <div
                                  key={s.id}
                                  className="px-5 py-3 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                                      {s.installmentNumber}
                                    </span>
                                    <div>
                                      <p className="text-sm text-slate-700 font-medium">
                                        {fmtDate(s.dueDate)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {fmtAmt(s.totalAmount)}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${pill.bg} ${pill.text}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${pill.dot}`}
                                    />
                                    {pill.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {totalRepay > 10 && (
                  <Pagination
                    page={repayPage}
                    totalPages={totalRepayPages}
                    total={totalRepay}
                    limit={repayLimit}
                    onPageChange={setRepayPage}
                  />
                )}
              </div>
            )}
          </>
        );
      })()}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pb-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3
                  id="pay-modal-title"
                  className="text-base font-bold text-slate-900"
                >
                  {modal.mode === "liquidate"
                    ? "Clear All — Pay in Full"
                    : "Select Month to Pay"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modal.mode === "liquidate"
                    ? "All unpaid instalments will be cleared in one payment."
                    : "Select one or more instalments you want to pay now."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              {unpaid.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  All instalments have been paid.
                </p>
              ) : (
                unpaid.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  const pill = STATUS_PILL[s.status] ?? STATUS_PILL.upcoming;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (modal.mode === "liquidate") return;
                        setSelectedIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== s.id)
                            : [...prev, s.id],
                        );
                      }}
                      disabled={modal.mode === "liquidate"}
                      className={`w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? "border-brand bg-brand/5"
                          : "border-slate-200 hover:border-brand/40"
                      } ${modal.mode === "liquidate" ? "cursor-default" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {modal.mode !== "liquidate" && (
                          <span
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? "bg-brand border-brand" : "border-slate-300"}`}
                          >
                            {isSelected && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-2.5 h-2.5"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                        )}
                        <div>
                          <p
                            className={`text-sm font-semibold ${isSelected ? "text-brand" : "text-slate-800"}`}
                          >
                            Instalment {s.installmentNumber} —{" "}
                            {fmtDate(s.dueDate)}
                          </p>
                          <p
                            className={`text-xs ${isSelected ? "text-brand/70" : "text-slate-500"}`}
                          >
                            {fmtAmt(s.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${pill.bg} ${pill.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${pill.dot}`}
                        />
                        {pill.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-3">
              {selectedIds.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="text-slate-600 font-medium"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Total to pay
                  </span>
                  <span className="text-lg font-extrabold text-brand">
                    {fmtAmt(selectedTotal)}
                  </span>
                </div>
              )}

              {payError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 font-medium">
                  {payError}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={selectedIds.length === 0}
                className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                Process Repayment
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <span
    className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin inline-block"
    aria-hidden="true"
  />
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-4 h-4 text-slate-400 shrink-0"}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckBadge = ({ paid }: { paid: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
      paid
        ? "bg-green-50 text-green-700 border-green-100"
        : "bg-green-50 text-green-700 border-green-100"
    }`}
  >
    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-2.5 h-2.5"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    {paid ? "Paid" : "Scheduled"}
  </span>
);

const PlanCard: React.FC<{
  tenor: number;
  totalAmount: number;
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: () => void;
}> = ({ tenor, totalAmount, isSelected, isAvailable, onSelect }) => {
  const meta = PLAN_META[tenor] ?? {
    label: `${tenor}-Month Plan`,
    tagline: "",
    badge: "",
  };
  const monthly = Math.round(totalAmount / tenor);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isAvailable}
      className={`relative w-full text-left rounded-2xl border-2 p-4 transition-all focus:outline-none ${
        isSelected
          ? "border-brand bg-white shadow-md"
          : isAvailable
            ? "border-slate-200 bg-white hover:border-brand/40 hover:shadow-sm"
            : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isSelected ? "border-brand" : "border-slate-300"
            }`}
          >
            {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
          </span>
          <span className="text-sm font-bold text-slate-800">{meta.label}</span>
        </div>
        {isSelected && (
          <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        {meta.tagline}
      </p>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Monthly instalment</span>
          <span className="font-bold text-slate-800">{fmt(monthly)}</span>
        </div>
        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-600 font-medium">
            Total tuition repayable
          </span>
          <span className="font-extrabold text-slate-900">
            {fmt(totalAmount)}
          </span>
        </div>
      </div>

      {meta.badge && (
        <p
          className={`mt-2.5 text-center text-[11px] font-semibold ${
            isSelected ? "text-brand" : "text-slate-400"
          }`}
        >
          {meta.badge}
        </p>
      )}
    </button>
  );
};

const ParentRepaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get("applicationId");

  const [appData, setAppData] = useState<ApplicationData | null>(null);
  const [loadingApp, setLoadingApp] = useState(!!applicationId);
  const [loadError, setLoadError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const loadSchedule = useCallback(async (id: string) => {
    setLoadingApp(true);
    setLoadError("");
    try {
      const data = await (
        parentService.getRepaymentSchedule as (id: string) => Promise<unknown>
      )(id);
      setAppData(data as ApplicationData);
    } catch {
      setLoadError("Failed to load repayment details. Please refresh.");
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    loadSchedule(applicationId);
  }, [applicationId, loadSchedule]);

  const handleConfirm = useCallback(async () => {
    if (!applicationId) return;
    setConfirmError("");
    setConfirming(true);
    try {
      await parentService.setupRepayment(applicationId, {});
      await loadSchedule(applicationId);
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
  }, [applicationId, loadSchedule]);

  if (!applicationId) {
    return <RepaymentDashboard />;
  }

  if (loadingApp) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pt-8">
        <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-5 text-red-700 text-sm font-medium">
          {loadError}
        </div>
      </div>
    );
  }

  if (!appData) return null;

  const totalAmount = Number(appData.amountApproved ?? appData.amountRequested);
  const installmentPrincipal = Math.round(totalAmount / appData.tenor);
  const hasSchedule = (appData.schedule?.length ?? 0) > 0;
  const studentName = appData.student
    ? `${appData.student.firstName ?? ""} ${appData.student.lastName ?? ""}`.trim()
    : "—";

  const planTenors = Array.from(
    new Set([...ALL_PLAN_TENORS, appData.tenor]),
  ).sort((a, b) => a - b);

  const firstPaymentDate = appData.schedule?.[0]?.dueDate ?? null;

  const scheduleRows: {
    id: string;
    num: number;
    dueDate: string;
    principal: number;
    status: InstallmentStatus;
  }[] = hasSchedule
    ? (appData.schedule ?? []).map((s) => ({
        id: s.id,
        num: s.installmentNumber,
        dueDate: s.dueDate,
        principal: Number(s.principalAmount),
        status: s.status,
      }))
    : Array.from({ length: appData.tenor }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1 + i);
        d.setDate(10);
        return {
          id: String(i),
          num: i + 1,
          dueDate: d.toISOString().split("T")[0],
          principal: installmentPrincipal,
          status: "upcoming" as InstallmentStatus,
        };
      });

  const SidebarContent = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#881337"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800">Repayment summary</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Total Tuition Amount</span>
          <span className="font-semibold text-slate-800">
            {fmt(totalAmount)}
          </span>
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700">
            Total Amount Payable
          </span>
          <span className="text-xl font-extrabold text-brand">
            {fmt(totalAmount)}
          </span>
        </div>
      </div>

      {firstPaymentDate && (
        <div className="rounded-xl bg-brand/5 border border-brand/10 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand">First Payment</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {fmtDate(firstPaymentDate)}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
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
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">
            No interest is charged.
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            You repay the amount disbursed plus the applicable service charge.
          </p>
        </div>
      </div>

      {!hasSchedule && (
        <>
          {confirmError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 font-medium">
              {confirmError}
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {confirming ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Confirm repayment schedule
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/parent/applications")}
            className="w-full text-center text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            Save and continue later
          </button>
        </>
      )}

      {hasSchedule && (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-start gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-green-600 shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-green-700 font-semibold leading-relaxed">
            Repayment schedule confirmed. The funding partner has been notified.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full pt-4 pb-24 space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/parent/applications")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover transition-colors group"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Applications
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span className="text-xs font-bold text-brand">
              Schedule repayment
            </span>
          </div>
          <div className="w-12 h-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border-2 border-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Application overview
            </span>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
          Schedule Your Repayment
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a repayment plan that works for you before continuing to your
          application overview.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-5 order-2 lg:order-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#881337"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-800">
                Application Summary
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Student Name</p>
                <p className="text-sm font-bold text-slate-900">
                  {studentName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">School</p>
                <p className="text-sm font-bold text-slate-900">
                  {appData.catalogSchool?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tuition Amount</p>
                <p className="text-sm font-bold text-slate-900">
                  {fmt(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarIcon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Choose your repayment plan
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Select the plan that suits your financial situation. All plans
                  have the same total amount, with different payment durations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
              {planTenors.map((t) => (
                <PlanCard
                  key={t}
                  tenor={t}
                  totalAmount={totalAmount}
                  isSelected={t === appData.tenor}
                  isAvailable={t === appData.tenor}
                  onSelect={() => {}}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarIcon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Your repayment schedule
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasSchedule
                    ? "Your confirmed repayment schedule."
                    : "This is a preview of your repayment plan. You can edit the due dates before confirming."}
                </p>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {[
                      "#",
                      "Due Date",
                      "Principal Instalment",
                      "Total Payment",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 md:px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${
                          i === 0 || i === 1
                            ? "text-left"
                            : i === 4
                              ? "text-center"
                              : i === 5
                                ? "text-right"
                                : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row, idx) => {
                    const isLast = idx === scheduleRows.length - 1;
                    const isPaid =
                      row.status === "paid" || row.status === "waived";
                    return (
                      <tr
                        key={row.id}
                        className={`${!isLast ? "border-b border-slate-50" : ""} hover:bg-slate-50/50 transition-colors`}
                      >
                        <td className="px-4 md:px-5 py-3.5 text-slate-500 text-sm font-medium">
                          {row.num}
                        </td>
                        <td className="px-4 md:px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <CalendarIcon />
                            <span className="text-sm text-slate-700 font-medium whitespace-nowrap">
                              {fmtDate(row.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-right text-sm text-slate-700 font-medium">
                          {fmt(row.principal)}
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-right text-sm font-bold text-slate-900">
                          {fmt(row.principal)}
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-center">
                          <CheckBadge paid={isPaid} />
                        </td>
                        <td className="px-4 md:px-5 py-3.5 text-right">
                          <button
                            type="button"
                            aria-label={`Edit instalment ${row.num}`}
                            className="text-slate-300 hover:text-brand transition-colors"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                              aria-hidden="true"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {scheduleRows.map((row) => {
                const isPaid = row.status === "paid" || row.status === "waived";
                return (
                  <div
                    key={row.id}
                    className="px-4 py-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                        {row.num}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">
                            {fmtDate(row.dueDate)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {fmt(row.principal)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckBadge paid={isPaid} />
                      <button
                        type="button"
                        aria-label={`Edit instalment ${row.num}`}
                        className="text-slate-300 hover:text-brand transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-72 xl:w-80 shrink-0 order-1 lg:order-2">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
};

export default ParentRepaymentPage;
