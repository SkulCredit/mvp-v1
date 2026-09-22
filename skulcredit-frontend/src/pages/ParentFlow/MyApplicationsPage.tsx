import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";
import { resolveUploadUrl } from "../../utils/uploadUrl";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "info_requested"
  | "approved"
  | "disbursed"
  | "rejected";

interface Application {
  id: string;
  applicationId: string;
  studentName: string;
  studentPhoto: string;
  schoolName: string;
  grade: string;
  status: ApplicationStatus;
  totalAmount: number;
  submittedOn: string;
  submittedOnRaw: string;
  lastUpdated: string;
  tenor?: number;
  raw?: RawApplication;
}

interface RawEvent {
  id?: string;
  status?: string;
  note?: string;
  createdAt?: string;
  actor?: string;
}

interface RawApplication {
  id: string;
  referenceNumber?: string;
  amountRequested?: number;
  amountApproved?: number | null;
  status?: string;
  tenor?: number;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string | null;
  adminNote?: string | null;
  student?: {
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    studentId?: string | null;
    profilePhotoUrl?: string;
  };
  catalogSchool?: { name?: string };
  school?: { name?: string; schoolName?: string };
  events?: RawEvent[];
}

function mapStatus(raw: string): ApplicationStatus {
  switch (raw) {
    case "pending":
    case "school_verification":
      return "submitted";
    case "under_review":
      return "under_review";
    case "info_requested":
      return "info_requested";
    case "approved":
      return "approved";
    case "disbursed":
    case "repaid":
      return "disbursed";
    case "rejected":
    case "cancelled":
      return "rejected";
    default:
      return "submitted";
  }
}

const STATUS_CFG: Record<
  ApplicationStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: "clock" | "check" | "x" | "send" | "zap" | "file" | "alert";
  }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    icon: "file",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-500",
    icon: "send",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    dot: "bg-amber-400",
    icon: "clock",
  },
  info_requested: {
    label: "Action Required",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
    dot: "bg-orange-400",
    icon: "alert",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
    dot: "bg-green-500",
    icon: "check",
  },
  disbursed: {
    label: "Disbursed",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    dot: "bg-purple-500",
    icon: "zap",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-100",
    dot: "bg-red-400",
    icon: "x",
  },
};

const TAB_ORDER: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "disbursed",
  "rejected",
];

const TAB_LABELS: Record<"all" | ApplicationStatus, string> = {
  all: "All",
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  info_requested: "Action Required",
  approved: "Approved",
  disbursed: "Disbursed",
  rejected: "Rejected",
};

function normalize(raw: RawApplication): Application {
  const firstName = raw.student?.firstName ?? "";
  const lastName = raw.student?.lastName ?? "";
  const studentName = `${firstName} ${lastName}`.trim() || "Unknown Student";
  return {
    id: raw.id,
    applicationId: raw.referenceNumber ?? raw.id.slice(0, 12).toUpperCase(),
    studentName,
    studentPhoto:
      resolveUploadUrl(raw.student?.profilePhotoUrl) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=881337&color=fff&size=44`,
    schoolName:
      raw.catalogSchool?.name ??
      raw.school?.name ??
      raw.school?.schoolName ??
      "\u2014",
    grade: raw.student?.gradeLevel ?? "\u2014",
    status: mapStatus(raw.status ?? "pending"),
    totalAmount: Number(raw.amountRequested ?? 0),
    tenor: raw.tenor,
    submittedOnRaw: raw.createdAt ?? "",
    submittedOn: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "\u2014",
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "\u2014",
    raw,
  };
}

const IconSend = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconClock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconZap = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconFile = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconAlert = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function StatusIcon({
  icon,
}: {
  icon: (typeof STATUS_CFG)[ApplicationStatus]["icon"];
}) {
  switch (icon) {
    case "send":
      return <IconSend />;
    case "clock":
      return <IconClock />;
    case "check":
      return <IconCheck />;
    case "x":
      return <IconX />;
    case "zap":
      return <IconZap />;
    case "alert":
      return <IconAlert />;
    default:
      return <IconFile />;
  }
}

const StatusBadge: React.FC<{
  status: ApplicationStatus;
  size?: "sm" | "md";
}> = ({ status, size = "sm" }) => {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${size === "md" ? "text-xs" : "text-[11px]"}`}
    >
      <StatusIcon icon={cfg.icon} />
      {cfg.label}
    </span>
  );
};

const ApplicationsTable: React.FC<{
  apps: Application[];
  onRowClick: (app: Application) => void;
}> = ({ apps, onRowClick }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full min-w-[750px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          {["Student", "Application ID", "Status", "Total Amount", ""].map(
            (h, i) => (
              <th
                key={i}
                className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap ${i === 3 ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {apps.map((app) => (
          <tr
            key={app.id}
            onClick={() => onRowClick(app)}
            className="group cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <td className="px-5 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <img
                  src={app.studentPhoto}
                  alt={app.studentName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(app.studentName)}&background=881337&color=fff&size=44`;
                  }}
                />
                <div>
                  <p className="font-bold text-gray-900 leading-snug">
                    {app.studentName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {app.schoolName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3 shrink-0"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    {app.grade}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-5 py-4 whitespace-nowrap">
              <p className="text-xs text-gray-400 mb-0.5">Application ID</p>
              <p className="font-bold text-gray-900">{app.applicationId}</p>
              <p className="mt-1 text-xs text-gray-400">
                Submitted on{" "}
                <span className="text-gray-600">{app.submittedOn}</span>
              </p>
            </td>
            <td className="px-5 py-4 whitespace-nowrap">
              <p className="text-xs text-gray-400 mb-1.5">Status</p>
              <StatusBadge status={app.status} />
              <p className="mt-2 text-xs text-gray-400">
                Last updated{" "}
                <span className="text-gray-600">{app.lastUpdated}</span>
              </p>
            </td>
            <td className="px-5 py-4 whitespace-nowrap text-right">
              <p className="text-xs text-gray-400 mb-1">Total Amount</p>
              <p className="font-bold text-gray-900">
                {"\u20A6"}
                {app.totalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </td>
            <td className="pr-4 py-4 whitespace-nowrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface DateRange {
  from: string;
  to: string;
}

const DateRangeDropdown: React.FC<{
  value: DateRange;
  onApply: (r: DateRange) => void;
  onClose: () => void;
}> = ({ value, onApply, onClose }) => {
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const [error, setError] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors";

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-[200] mt-2 w-72 rounded-xl bg-white border border-gray-100 shadow-xl overflow-hidden"
      role="dialog"
      aria-label="Filter by date"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-700">
          Filter by Date Range
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            className="text-xs font-medium text-gray-500"
            htmlFor="app-date-from"
          >
            From
          </label>
          <input
            id="app-date-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setError("");
            }}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className="text-xs font-medium text-gray-500"
            htmlFor="app-date-to"
          >
            To
          </label>
          <input
            id="app-date-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setError("");
            }}
            className={inputCls}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
          ].map(({ label, days }) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                const today = new Date(),
                  past = new Date();
                past.setDate(today.getDate() - days);
                setFrom(past.toISOString().split("T")[0]);
                setTo(today.toISOString().split("T")[0]);
                setError("");
              }}
              className="rounded-full border border-brand/30 px-2.5 py-1 text-[11px] font-medium text-brand hover:bg-brand/5 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            onApply({ from: "", to: "" });
            onClose();
          }}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (from && to && from > to) {
                setError('"From" must be before "To".');
                return;
              }
              onApply({ from, to });
              onClose();
            }}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

interface TimelineStep {
  label: string;
  sub: string;
  state: "done" | "active" | "pending" | "rejected";
  variant?: "rejected";
}

function buildTimeline(app: Application, _events: RawEvent[]): TimelineStep[] {
  const status = app.status;

  const step = (
    label: string,
    sub: string,
    state: TimelineStep["state"],
    variant?: "rejected",
  ): TimelineStep => ({ label, sub, state, variant }) as TimelineStep;

  const done = (label: string, sub: string) => step(label, sub, "done");
  const active = (label: string, sub: string) => step(label, sub, "active");
  const pending = (label: string) => step(label, "Pending", "pending");
  const rejected = (label: string, sub: string) => step(label, sub, "rejected");

  const submitted = done("Application Submitted", app.submittedOn);
  const underReview = (s: TimelineStep["state"], sub = "Pending") =>
    step("Under Review", sub, s);
  const decision = (
    s: TimelineStep["state"],
    sub = "Pending",
    variant?: "rejected",
  ) => step("Decision", sub, s, variant);
  const serviceFee = (s: TimelineStep["state"], sub = "Pending") =>
    step("Pay Service Charge", sub, s);
  const repayment = (s: TimelineStep["state"], sub = "Pending") =>
    step("Setup Repayment Plan", sub, s);
  const disburse = (s: TimelineStep["state"], sub = "Pending") =>
    step("Disbursed to School", sub, s);

  switch (status) {
    case "submitted":
      return [
        submitted,
        underReview("pending"),
        decision("pending"),
        serviceFee("pending"),
        repayment("pending"),
        disburse("pending"),
      ];

    case "under_review":
      return [
        submitted,
        done("Under Review", app.lastUpdated),
        done("Decision", app.lastUpdated),
        active("Pay Service Charge", "Action required"),
        pending("Setup Repayment Plan"),
        pending("Disbursed to School"),
      ];

    case "info_requested":
      return [
        submitted,
        done("Under Review", app.lastUpdated),
        done("Decision", app.lastUpdated),
        active("Pay Service Charge", "Action required"),
        pending("Setup Repayment Plan"),
        pending("Disbursed to School"),
      ];

    case "approved":
      return [
        submitted,
        done("Under Review", app.lastUpdated),
        done("Decision", app.lastUpdated),
        active("Pay Service Charge", "Action required"),
        pending("Setup Repayment Plan"),
        pending("Disbursed to School"),
      ];

    case "disbursed":
      return [
        submitted,
        done("Under Review", app.lastUpdated),
        done("Decision", app.lastUpdated),
        done("Pay Service Charge", app.lastUpdated),
        done("Setup Repayment Plan", app.lastUpdated),
        done("Disbursed to School", app.lastUpdated),
      ];

    case "rejected":
      return [
        submitted,
        done("Under Review", app.lastUpdated),
        rejected("Decision", app.lastUpdated),
        pending("Pay Service Charge"),
        pending("Setup Repayment Plan"),
        pending("Disbursed to School"),
      ];

    case "draft":
      return [active("Application Submitted", app.submittedOn)];

    default:
      return [
        submitted,
        underReview("pending"),
        decision("pending"),
        serviceFee("pending"),
        repayment("pending"),
        disburse("pending"),
      ];
  }
}

const TimelineDot: React.FC<{ state: TimelineStep["state"] }> = ({ state }) => {
  if (state === "done")
    return (
      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  if (state === "rejected")
    return (
      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    );
  if (state === "active")
    return (
      <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-sm ring-4 ring-brand/20">
        <div className="w-2.5 h-2.5 rounded-full bg-white" />
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-gray-300" />
    </div>
  );
};

function repaymentLabel(tenor?: number | null): string {
  if (!tenor) return "\u2014";
  if (tenor === 1) return "Full payment";
  return `${tenor}-month plan`;
}

interface DetailState {
  loading: boolean;
  error: string | null;
  detail: RawApplication | null;
}

const ApplicationDetailView: React.FC<{
  app: Application;
  onBack: () => void;
  onNewApplication: () => void;
}> = ({ app, onBack, onNewApplication }) => {
  const [ds, setDs] = useState<DetailState>({
    loading: true,
    error: null,
    detail: null,
  });

  useEffect(() => {
    setDs({ loading: true, error: null, detail: null });
    (parentService.getApplicationDetails as (id: string) => Promise<unknown>)(
      app.id,
    )
      .then((data) =>
        setDs({ loading: false, error: null, detail: data as RawApplication }),
      )
      .catch(() =>
        setDs({
          loading: false,
          error: "Failed to load application details.",
          detail: null,
        }),
      );
  }, [app.id]);

  const detail = ds.detail;
  const events: RawEvent[] = detail?.events ?? [];
  const timeline = buildTimeline(app, events);

  const schoolName =
    detail?.catalogSchool?.name ??
    detail?.school?.name ??
    detail?.school?.schoolName ??
    app.schoolName;
  const grade = detail?.student?.gradeLevel ?? app.grade;
  const submittedOn = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : app.submittedOn;
  const amount = Number(detail?.amountRequested ?? app.totalAmount);
  const tenor = detail?.tenor ?? app.tenor;
  const rejectionReason = detail?.rejectionReason ?? detail?.adminNote;
  const showInfoRequestedBanner = app.status === "info_requested";
  const showRejectedBanner = app.status === "rejected";
  const showDraftBanner = app.status === "draft";

  return (
    <div className="flex flex-col gap-0 animate-fade-in-up w-[90%] mx-auto pt-6 pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover transition-colors mb-6 self-start group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <img
          src={app.studentPhoto}
          alt={app.studentName}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(app.studentName)}&background=881337&color=fff&size=56`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold text-gray-900">
            {app.studentName}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {[schoolName, grade]
              .filter((v) => v && v !== "\u2014")
              .join(" \u00B7 ")}
          </p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={app.status} size="md" />
        </div>
      </div>

      {showInfoRequestedBanner && (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <IconAlert />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-orange-700">
                We need more information
              </p>
              <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">
                Upload the document below to continue processing this
                application. You don&apos;t need to restart or resubmit anything
                else.
              </p>
              {rejectionReason && (
                <p className="mt-2 text-xs font-medium text-orange-700 flex items-start gap-1.5">
                  <span className="text-brand font-bold">•</span>{" "}
                  {rejectionReason}
                </p>
              )}
            </div>
            <button className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover transition-colors shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload docs
            </button>
          </div>
        </div>
      )}

      {showRejectedBanner && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <IconAlert />
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-700">
                Application rejected
              </p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed truncate">
                {rejectionReason ??
                  "Your application did not meet the requirements for the requested repayment plan."}
              </p>
            </div>
          </div>
          <button
            onClick={onNewApplication}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover transition-colors shadow-sm"
          >
            Continue Application
          </button>
        </div>
      )}

      {showDraftBanner && (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <IconAlert />
            <div className="min-w-0">
              <p className="text-sm font-bold text-orange-700">
                This application isn&apos;t submitted yet
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Pick up where you left off — school and repayment details are
                still needed.
              </p>
            </div>
          </div>
          <button
            onClick={onNewApplication}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover transition-colors shadow-sm"
          >
            Continue Application
          </button>
        </div>
      )}

      {ds.loading && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ds.loading && ds.error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 flex items-center gap-4">
          <p className="text-sm text-red-700 font-medium">{ds.error}</p>
          <button
            onClick={() => setDs({ loading: true, error: null, detail: null })}
            className="ml-auto text-xs font-bold text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!ds.loading && !ds.error && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-brand"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <h3 className="text-sm font-bold text-brand">
                Application details
              </h3>
            </div>

            <div className="px-6 py-2 divide-y divide-gray-100">
              {[
                { label: "Application ID", value: app.applicationId },
                { label: "Repayment plan", value: repaymentLabel(tenor) },
                { label: "Submitted on", value: submittedOn },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-4"
                >
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-bold text-brand">
                  Total amount
                </span>
                <span className="text-sm font-extrabold text-brand">
                  {"\u20A6"}
                  {amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-brand"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 className="text-sm font-bold text-brand">Timeline</h3>
            </div>

            <div className="px-6 py-5">
              <ol className="relative flex flex-col gap-0">
                {timeline.map((step, idx) => {
                  const isLast = idx === timeline.length - 1;
                  const isPayServiceCharge =
                    step.label === "Pay Service Charge" &&
                    step.state === "active";
                  const isSetupRepayment =
                    step.label === "Setup Repayment Plan" &&
                    step.state === "active";
                  const connectorColor =
                    step.state === "done"
                      ? "bg-green-200"
                      : step.state === "rejected"
                        ? "bg-red-200"
                        : "bg-gray-100";
                  return (
                    <li key={idx} className="flex items-start gap-3 relative">
                      {!isLast && (
                        <div
                          className={`absolute left-[13px] top-7 bottom-0 w-[2px] z-0 ${connectorColor}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative z-10 shrink-0 mt-0.5">
                        <TimelineDot state={step.state} />
                      </div>
                      <div className={`flex-1 pb-5 ${isLast ? "pb-0" : ""}`}>
                        <p
                          className={`text-sm font-semibold leading-snug ${
                            step.state === "rejected"
                              ? "text-red-600"
                              : step.state === "pending"
                                ? "text-gray-400"
                                : "text-gray-900"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            step.state === "rejected"
                              ? "text-red-400"
                              : step.state === "pending"
                                ? "text-gray-300"
                                : "text-gray-400"
                          }`}
                        >
                          {step.sub}
                        </p>
                        {isPayServiceCharge && (
                          <a
                            href={`/parent/service-charge?applicationId=${app.id}`}
                            className="mt-2 inline-flex items-center gap-1.5 bg-brand text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-brand-hover transition-colors shadow-sm"
                          >
                            Pay Service Charge →
                          </a>
                        )}
                        {isSetupRepayment && (
                          <a
                            href={`/parent/repayment?applicationId=${app.id}`}
                            className="mt-2 inline-flex items-center gap-1.5 bg-brand text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-brand-hover transition-colors shadow-sm"
                          >
                            Setup Repayment Plan →
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    setLoading(true);
    parentService
      .getApplications()
      .then((data) => {
        const raw = Array.isArray(data) ? (data as RawApplication[]) : [];
        setApplications(raw.map(normalize));
      })
      .catch(() =>
        setFetchError("Failed to load applications. Please refresh."),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleNewApplication = () => navigate("/parent/details");

  const handleRowClick = useCallback((app: Application) => {
    setSelectedApp(app);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedApp(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [activeFilter, setActiveFilter] = useState<"all" | ApplicationStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [dateDropOpen, setDateDropOpen] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const s of TAB_ORDER)
      counts[s] = applications.filter((a) => a.status === s).length;
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    let list = [...applications];
    if (activeFilter !== "all")
      list = list.filter((a) => a.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.studentName.toLowerCase().includes(q) ||
          a.schoolName.toLowerCase().includes(q) ||
          a.applicationId.toLowerCase().includes(q),
      );
    }

    if (dateRange.from || dateRange.to) {
      list = list.filter((a) => {
        if (!a.submittedOnRaw) return true;
        const d = new Date(a.submittedOnRaw);
        if (dateRange.from && d < new Date(dateRange.from)) return false;
        if (dateRange.to && d > new Date(dateRange.to + "T23:59:59"))
          return false;
        return true;
      });
    }
    return list;
  }, [applications, activeFilter, search, dateRange]);

  const hasDateFilter = !!(dateRange.from || dateRange.to);
  const dateLabel = hasDateFilter
    ? [dateRange.from, dateRange.to].filter(Boolean).join(" \u2192 ")
    : "Sort by Date";

  if (selectedApp) {
    return (
      <ApplicationDetailView
        app={selectedApp}
        onBack={handleBack}
        onNewApplication={handleNewApplication}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-8 pb-12 animate-fade-in-up w-[90%] mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">
          My Applications
        </h2>
        <p className="mt-0.5 text-sm text-gray-400">
          Track and manage all your tuition applications
        </p>
      </div>
      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && fetchError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 flex items-center gap-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-red-500 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-700 font-medium">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !fetchError && (
        <>
          <div className="rounded-2xl bg-brand px-5 pt-4 pb-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["all", ...TAB_ORDER] as const).map((s) => {
                const active = activeFilter === s;
                const count = statusCounts[s] ?? 0;
                return (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(s)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-white text-brand border-white shadow-sm"
                        : "bg-transparent text-white/80 border-white/30 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {TAB_LABELS[s]}
                    <span
                      className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 ${active ? "bg-brand text-white" : "bg-white/20 text-white"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/50">
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name, school, or application ID..."
                  className="w-full rounded-full border border-white/30 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-colors"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setDateDropOpen((o) => !o)}
                  className={`flex w-full items-center justify-between rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                    hasDateFilter
                      ? "border-white bg-white text-brand"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span className="truncate">{dateLabel}</span>
                  </span>
                  {hasDateFilter ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear date filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateRange({ from: "", to: "" });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          setDateRange({ from: "", to: "" });
                        }
                      }}
                      className="shrink-0 ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 hover:bg-brand/40 cursor-pointer transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="shrink-0 ml-2 text-white/60"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>
                {dateDropOpen && (
                  <DateRangeDropdown
                    value={dateRange}
                    onApply={setDateRange}
                    onClose={() => setDateDropOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-800 shrink-0">
                Your Applications{" "}
                <span className="text-gray-400 font-semibold">
                  ({filtered.length})
                </span>
              </h3>
              {hasDateFilter && (
                <span className="text-xs font-medium text-brand truncate">
                  Filtered: {dateRange.from || "any"} {"\u2192"}{" "}
                  {dateRange.to || "any"}
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-700 mb-1">
                  {search || activeFilter !== "all"
                    ? "No matching applications"
                    : "No Applications Yet"}
                </h4>
                <p className="text-sm text-gray-400 max-w-xs mb-6">
                  {search || activeFilter !== "all"
                    ? "Try adjusting your filters or search term."
                    : "Start your first application to get tuition support for your child."}
                </p>
                {!search && activeFilter === "all" && (
                  <button
                    onClick={handleNewApplication}
                    className="inline-flex items-center gap-2 bg-brand text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Application
                  </button>
                )}
              </div>
            ) : (
              <ApplicationsTable apps={filtered} onRowClick={handleRowClick} />
            )}
          </div>
          <div className="rounded-2xl border border-pink-200 bg-[#FFF5F8] px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-brand">
                Need to apply for another child
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                You can start a new application for another child under your
                account
              </p>
            </div>
            <button
              onClick={handleNewApplication}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border-2 border-brand bg-white px-5 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-white transition-all shadow-sm whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Application
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyApplicationsPage;
