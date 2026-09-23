import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

type InstallmentStatus =
  | "upcoming"
  | "due"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "waived";

type MandateStatus = "not_set" | "pending" | "active" | "failed" | "cancelled";

interface PreviewInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  outstandingBalance: number;
}

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

interface MandatePreviewData {
  tenor: number;
  totalAmount: number;
  debitDay: number;
  installmentAmount: number;
  preview: PreviewInstallment[];
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

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

const STATUS_CONFIG: Record<
  InstallmentStatus,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  upcoming: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Upcoming",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  due: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    label: "Due Now",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  paid: {
    bg: "bg-green-50",
    text: "text-green-600",
    label: "Paid",
    icon: (
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
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  partially_paid: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    label: "Partial",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  overdue: {
    bg: "bg-red-50",
    text: "text-red-600",
    label: "Overdue",
    icon: (
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
    ),
  },
  waived: {
    bg: "bg-gray-50",
    text: "text-gray-500",
    label: "Waived",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
};

const DEBIT_DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28];

const DonutRing: React.FC<{ pct: number; size?: number; stroke?: number }> = ({
  pct,
  size = 80,
  stroke = 10,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#881337"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  );
};

const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const s =
    size === "sm"
      ? "w-4 h-4 border-2"
      : size === "lg"
        ? "w-10 h-10 border-4"
        : "w-6 h-6 border-[3px]";
  return (
    <span
      className={`${s} border-current border-t-transparent rounded-full animate-spin inline-block`}
      aria-hidden="true"
    />
  );
};

const ParentRepaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get("applicationId");

  const [appData, setAppData] = useState<ApplicationData | null>(null);
  const [loadingApp, setLoadingApp] = useState(!!applicationId);
  const [loadError, setLoadError] = useState("");

  const [debitDay, setDebitDay] = useState<number>(25);
  const [preview, setPreview] = useState<MandatePreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!applicationId || !appData || (appData.schedule?.length ?? 0) > 0)
      return;
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const data = await (
          parentService.getMandatePreview as (
            id: string,
            day: number,
          ) => Promise<unknown>
        )(applicationId, debitDay);
        setPreview(data as MandatePreviewData);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 350);
    return () => {
      if (previewDebounce.current) clearTimeout(previewDebounce.current);
    };
  }, [applicationId, appData, debitDay]);

  const handleConfirm = useCallback(async () => {
    if (!applicationId) return;
    setConfirmError("");
    setConfirming(true);
    try {
      await parentService.setupRepayment(applicationId, { debitDay });
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
  }, [applicationId, debitDay, loadSchedule]);

  if (!applicationId) {
    return (
      <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto pb-12">
        <h2 className="text-xl font-extrabold text-slate-900">Repayment</h2>
        <p className="mt-0.5 text-sm text-gray-400">
          View and manage your active repayment schedules
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-20">
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
            Once your application is approved and the service charge paid, your
            repayment schedule will appear here.
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

  if (loadingApp) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spinner size="lg" />
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
  const serviceCharge = Number(appData.serviceChargeAmount ?? 0);
  const totalPayable = totalAmount + serviceCharge;
  const installmentAmount = Math.round(totalAmount / appData.tenor);
  const installmentServiceCharge = Math.round(serviceCharge / appData.tenor);
  const installmentTotal = installmentAmount + installmentServiceCharge;
  const hasSchedule = (appData.schedule?.length ?? 0) > 0;

  const studentName = appData.student
    ? `${appData.student.firstName ?? ""} ${appData.student.lastName ?? ""}`.trim()
    : "—";

  const paidCount =
    appData.schedule?.filter(
      (s) => s.status === "paid" || s.status === "waived",
    ).length ?? 0;
  const paidAmount =
    appData.schedule?.reduce((sum, s) => sum + Number(s.amountPaid ?? 0), 0) ??
    0;
  const paidPct =
    totalPayable > 0 ? Math.round((paidAmount / totalPayable) * 100) : 0;

  const nextDue = appData.schedule?.find(
    (s) => s.status === "upcoming" || s.status === "due",
  );

  const previewRows: PreviewInstallment[] =
    preview?.preview ??
    (hasSchedule
      ? (appData.schedule ?? []).map((s) => ({
          installmentNumber: s.installmentNumber,
          dueDate: s.dueDate,
          amount: Number(s.totalAmount),
          outstandingBalance: Number(s.outstandingBalance),
        }))
      : []);

  return (
    <div className="animate-fade-in-up w-[92%] mx-auto pb-24 pt-6 space-y-5">
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

      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {hasSchedule ? "Repayment Schedule" : "Setup Repayment Plan"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {hasSchedule
            ? "View your instalment plan and track your repayment progress."
            : "Choose your salary date and confirm your repayment plan."}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-800">
                Application Details
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="px-6 py-4 space-y-3">
                {[
                  { label: "Student Name", value: studentName },
                  {
                    label: "School",
                    value: appData.catalogSchool?.name ?? "—",
                  },
                  { label: "Tuition Amount", value: fmt(totalAmount) },
                  {
                    label: "Repayment Plan",
                    value: `${appData.tenor}-month plan`,
                  },
                  {
                    label: "Monthly Instalment",
                    value: fmt(installmentAmount),
                  },
                  {
                    label: "Service Charge",
                    value: serviceCharge > 0 ? fmt(serviceCharge) : "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {hasSchedule && (
                <div className="px-6 py-4 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">
                      Repayment Progress
                    </p>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        {paidCount} of {appData.tenor} installments paid
                      </span>
                      <span className="font-bold text-brand">{paidPct}%</span>
                    </div>
                  </div>
                  {nextDue && (
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
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
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 font-medium">
                          Next Due Date
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {fmtDate(nextDue.dueDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-brand font-semibold">
                          Amount Due
                        </p>
                        <p className="text-sm font-extrabold text-brand">
                          {fmt(nextDue.totalAmount)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {hasSchedule && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
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
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Payment Schedule
                  </p>
                  <p className="text-xs text-slate-500">
                    Your {appData.tenor}-month repayment plan
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {[
                        "#",
                        "Due Date",
                        "Principal Amount",
                        "Service Charge",
                        "Total Amount",
                        "Status",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${i === 0 || i === 1 ? "text-left" : i === 5 ? "text-center" : i === 6 ? "text-right" : "text-right"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(appData.schedule ?? []).map((s, idx) => {
                      const cfg =
                        STATUS_CONFIG[s.status] ?? STATUS_CONFIG.upcoming;
                      const isLast =
                        idx === (appData.schedule?.length ?? 0) - 1;
                      return (
                        <tr
                          key={s.id}
                          className={`${!isLast ? "border-b border-slate-50" : ""} hover:bg-slate-50/60 transition-colors`}
                        >
                          <td className="px-5 py-3.5 text-slate-500 font-medium text-sm">
                            {s.installmentNumber}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 text-sm">
                            {fmtDate(s.dueDate)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-700 font-medium text-sm">
                            {fmt(s.principalAmount)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-700 font-medium text-sm">
                            {fmt(installmentServiceCharge)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-800 text-sm">
                            {fmt(installmentTotal)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              aria-label={`Details for instalment ${s.installmentNumber}`}
                              className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-brand/10 hover:text-brand flex items-center justify-center transition-colors"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3 h-3"
                                aria-hidden="true"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!hasSchedule && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6 space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Choose your salary debit day
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Select the day of the month your salary arrives. SkulCredit
                  will automatically debit your account on that date each month.
                </p>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DEBIT_DAY_OPTIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDebitDay(day)}
                    className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${debitDay === day ? "bg-brand text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {ordinal(day)}
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-brand/5 border border-brand/10 px-4 py-3 flex items-start gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#881337"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-brand/80 leading-relaxed">
                  Your <strong>{fmt(installmentAmount)}</strong> debit will hit
                  on the <strong>{ordinal(debitDay)} of each month</strong>. You
                  keep the rest of your salary — only {fmt(installmentAmount)}{" "}
                  is collected per month.
                </p>
              </div>

              {loadingPreview && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Spinner size="sm" />
                  Updating preview…
                </div>
              )}

              {previewRows.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["#", "Debit Date", "Amount", "Balance After"].map(
                          (h, i) => (
                            <th
                              key={h}
                              className={`px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide ${i < 2 ? "text-left" : "text-right"}`}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previewRows.map((row) => (
                        <tr
                          key={row.installmentNumber}
                          className="hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-3 text-slate-500 text-sm">
                            {row.installmentNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm">
                            {fmtDate(row.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-brand text-sm">
                            {fmt(row.amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-sm">
                            {fmt(row.outstandingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {confirmError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
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
                    <Spinner size="sm" />
                    Setting up mandate…
                  </>
                ) : (
                  `Confirm & Set Up Auto-Debit on the ${ordinal(debitDay)} →`
                )}
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
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
              <p className="text-sm font-bold text-slate-800">
                Repayment Summary
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: "Total Tuition Amount", value: fmt(totalAmount) },
                {
                  label: "Total Service Charge",
                  value: serviceCharge > 0 ? fmt(serviceCharge) : "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-700">{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">
                  Total Amount Payable
                </span>
                <span className="text-lg font-extrabold text-brand">
                  {fmt(totalPayable)}
                </span>
              </div>
            </div>

            {hasSchedule && (
              <div className="flex flex-col items-center gap-2 py-4 border-t border-slate-100">
                <div className="relative">
                  <DonutRing pct={paidPct} size={90} stroke={11} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-extrabold text-brand leading-none">
                      {paidPct}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Amount Paid
                  </p>
                  <p className="text-lg font-extrabold text-slate-800">
                    {fmt(paidAmount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    of {fmt(totalPayable)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 px-4 py-4 flex items-start gap-3">
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
                Important
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Late payments may attract additional charges. Please ensure you
                make your payments on or before the due date.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentRepaymentPage;
