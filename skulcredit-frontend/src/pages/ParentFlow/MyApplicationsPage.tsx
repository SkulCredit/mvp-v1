import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
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
  lastUpdated: string;
}

// â”€â”€ Backend status â†’ frontend status mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapStatus(raw: string): ApplicationStatus {
  switch (raw) {
    case "pending":
      return "submitted";
    case "under_review":
    case "info_requested":
    case "school_verification":
      return "under_review";
    case "approved":
      return "approved";
    case "disbursed":
      return "disbursed";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "repaid":
      return "disbursed";
    default:
      return "submitted";
  }
}

// â”€â”€ Normalize API response â†’ Application â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface RawApplication {
  id: string;
  referenceNumber?: string;
  amountRequested?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    profilePhotoUrl?: string;
  };
  school?: {
    schoolName?: string;
  };
}

function normalize(raw: RawApplication): Application {
  const firstName = raw.student?.firstName ?? "";
  const lastName = raw.student?.lastName ?? "";
  const studentName = `${firstName} ${lastName}`.trim() || "Unknown Student";

  return {
    id: raw.id,
    applicationId: raw.referenceNumber ?? raw.id.slice(0, 12).toUpperCase(),
    studentName,
    studentPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=881337&color=fff&size=44`,
    schoolName: raw.school?.schoolName ?? "â€”",
    grade: raw.student?.gradeLevel ?? "â€”",
    status: mapStatus(raw.status ?? "pending"),
    totalAmount: Number(raw.amountRequested ?? 0),
    submittedOn: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "â€”",
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "â€”",
  };
}

// â”€â”€ Status config
const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    icon: "clock" | "check" | "x" | "send" | "zap" | "file";
  }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    icon: "file",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-500",
    icon: "send",
  },
  under_review: {
    label: "Under Review",
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
    icon: "clock",
  },
  approved: {
    label: "Approved",
    bg: "bg-green-50",
    text: "text-green-600",
    dot: "bg-green-500",
    icon: "check",
  },
  disbursed: {
    label: "Disbursed",
    bg: "bg-purple-50",
    text: "text-purple-600",
    dot: "bg-purple-500",
    icon: "zap",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-500",
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

// â”€â”€ Status Badge

const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];

  const Icon = () => {
    if (cfg.icon === "clock")
      return (
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
    if (cfg.icon === "check")
      return (
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
    if (cfg.icon === "x")
      return (
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
    if (cfg.icon === "send")
      return (
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
    if (cfg.icon === "zap")
      return (
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
    // file
    return (
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
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <Icon />
      {cfg.label}
    </span>
  );
};

// â”€â”€ Applications Table

const ApplicationsTable: React.FC<{
  apps: Application[];
  onRowClick: (app: Application) => void;
}> = ({ apps, onRowClick }) => (
  /* Outer wrapper: clips overflow and rounds the corners */
  <div className="w-full overflow-x-auto">
    <table className="w-full min-w-[750px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
            Student
          </th>
          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
            Application ID
          </th>
          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
            Status
          </th>
          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
            Total Amount
          </th>
          <th className="w-8" aria-hidden="true" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {apps.map((app) => (
          <tr
            key={app.id}
            onClick={() => onRowClick(app)}
            className="group cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {/* â”€â”€ Student â”€â”€ */}
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
                    {/* House / school icon */}
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
                    {/* Grid / grade icon */}
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

            {/* â”€â”€ Application ID â”€â”€ */}
            <td className="px-5 py-4 whitespace-nowrap">
              <p className="text-xs text-gray-400 mb-0.5">Application ID</p>
              <p className="font-bold text-gray-900">{app.applicationId}</p>
              <p className="mt-1 text-xs text-gray-400">
                Submitted on{" "}
                <span className="text-gray-600">{app.submittedOn}</span>
              </p>
            </td>

            {/* â”€â”€ Status â”€â”€ */}
            <td className="px-5 py-4 whitespace-nowrap">
              <p className="text-xs text-gray-400 mb-1.5">Status</p>
              <StatusBadge status={app.status} />
              <p className="mt-2 text-xs text-gray-400">
                Last updated{" "}
                <span className="text-gray-600">{app.lastUpdated}</span>
              </p>
            </td>

            {/* â”€â”€ Total Amount â”€â”€ */}
            <td className="px-5 py-4 whitespace-nowrap text-right">
              <p className="text-xs text-gray-400 mb-1">Total Amount</p>
              <p className="font-bold text-gray-900">
                â‚¦
                {app.totalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </td>

            {/* â”€â”€ Chevron â”€â”€ */}
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

// â”€â”€ Date Range Dropdown

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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleApply = () => {
    if (from && to && from > to) {
      setError('"From" must be before "To".');
      return;
    }
    onApply({ from, to });
    onClose();
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors";

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-[200] mt-2 w-72 rounded-xl bg-white border border-gray-100 shadow-xl overflow-hidden"
      role="dialog"
      aria-label="Sort / Filter by date"
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
                const today = new Date();
                const past = new Date();
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
            onClick={handleApply}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();

  // â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  // â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeFilter, setActiveFilter] = useState<"all" | ApplicationStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [dateDropOpen, setDateDropOpen] = useState(false);

  // â”€â”€ Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const s of TAB_ORDER) {
      counts[s] = applications.filter((a) => a.status === s).length;
    }
    return counts;
  }, [applications]);

  // â”€â”€ Filtered list â”€
  const filtered = useMemo(() => {
    let list = [...applications];

    if (activeFilter !== "all") {
      list = list.filter((a) => a.status === activeFilter);
    }

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
      list = list.filter((_a, i) => {
        void _a;
        return i >= 0;
      });
    }

    return list;
  }, [applications, activeFilter, search, dateRange]);

  const hasDateFilter = !!(dateRange.from || dateRange.to);
  const dateLabel = hasDateFilter
    ? [dateRange.from, dateRange.to].filter(Boolean).join(" â†’ ")
    : "Sort by Date";

  const handleRowClick = (app: Application) => {
    console.log("Navigate to application:", app.applicationId);
  };

  const TAB_LABELS: Record<"all" | ApplicationStatus, string> = {
    all: "All",
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    disbursed: "Disbursed",
    rejected: "Rejected",
  };

  return (
    <div className="flex flex-col gap-5 pt-8 pb-12 animate-fade-in-up w-[90%] mx-auto">
      {/* â”€â”€ Page heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">My Applications</h2>
        <p className="mt-0.5 text-sm text-gray-400">
          Track and manage all your tuition applications
        </p>
      </div>

      {/* â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Fetch error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && fetchError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 flex items-center gap-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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

      {/* â”€â”€ Main content (only when not loading) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && !fetchError && (
        <>
          {/* Filter toolbar */}
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
                      className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 ${
                        active ? "bg-brand text-white" : "bg-white/20 text-white"
                      }`}
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span className="truncate">{dateLabel}</span>
                  </span>
                  {hasDateFilter ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear date filter"
                      onClick={(e) => { e.stopPropagation(); setDateRange({ from: "", to: "" }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setDateRange({ from: "", to: "" }); } }}
                      className="shrink-0 ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 hover:bg-brand/40 cursor-pointer transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 ml-2 text-white/60">
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

          {/* Applications table card */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-800 shrink-0">
                Your Applications{" "}
                <span className="text-gray-400 font-semibold">({filtered.length})</span>
              </h3>
              <div className="flex items-center gap-3 min-w-0">
                {hasDateFilter && (
                  <span className="text-xs font-medium text-brand truncate">
                    Filtered: {dateRange.from || "any"} â†’ {dateRange.to || "any"}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-gray-400 sm:hidden shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Scroll to see more
                </span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-700 mb-1">
                  {search || activeFilter !== "all" ? "No matching applications" : "No Applications Yet"}
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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

          {/* "Need to apply for another child" banner */}
          <div className="rounded-2xl border border-pink-200 bg-[#FFF5F8] px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-brand">Need to apply for another child</p>
              <p className="mt-0.5 text-xs text-gray-500">
                You can start a new application for another child under your account
              </p>
            </div>
            <button
              onClick={handleNewApplication}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border-2 border-brand bg-white px-5 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-white transition-all shadow-sm whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
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

