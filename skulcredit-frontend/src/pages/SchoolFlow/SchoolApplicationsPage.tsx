import React, { useCallback, useEffect, useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppRecord {
  id: string;
  status: string;
  amount?: number;
  createdAt?: string;
  student?: {
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    studentId?: string;
  };
  parent?: { firstName?: string; lastName?: string; email?: string };
  [key: string]: unknown;
}

type StatusKey = "Pending" | "Verified" | "Completed";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: StatusKey | string; cls: string }> = {
  pending_school_approval: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  school_approved: {
    label: "Verified",
    cls: "bg-blue-50  text-blue-600  border border-blue-200",
  },
  disbursed: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
};

const statusOf = (s: string) =>
  STATUS_MAP[s] ?? {
    label: s,
    cls: "bg-slate-100 text-slate-600 border border-slate-200",
  };

// ── Static fallback data ──────────────────────────────────────────────────────

const STATIC_APPS: AppRecord[] = [
  {
    id: "APP-10234",
    status: "pending_school_approval",
    amount: 150000,
    createdAt: "2025-01-02T00:00:00Z",
    student: { firstName: "Chidi", lastName: "Okafor" },
    parent: { firstName: "Mrs.", lastName: "Okafor" },
  },
  {
    id: "APP-10233",
    status: "school_approved",
    amount: 80000,
    createdAt: "2025-02-24T00:00:00Z",
    student: { firstName: "Aminat", lastName: "Bello" },
    parent: { firstName: "Mr.", lastName: "Bello" },
  },
  {
    id: "APP-10234",
    status: "disbursed",
    amount: 200000,
    createdAt: "2025-02-28T00:00:00Z",
    student: { firstName: "Seyi", lastName: "Adekunle" },
    parent: { firstName: "Mrs.", lastName: "Adekunle" },
  },
  {
    id: "APP-10229",
    status: "pending_school_approval",
    amount: 120000,
    createdAt: "2025-03-12T00:00:00Z",
    student: { firstName: "Tunde", lastName: "Adeyemi" },
    parent: { firstName: "Mr.", lastName: "Adeyemi" },
  },
  {
    id: "APP-10228",
    status: "pending_school_approval",
    amount: 95000,
    createdAt: "2025-06-11T00:00:00Z",
    student: { firstName: "Ngozi", lastName: "Eze" },
    parent: { firstName: "Mrs.", lastName: "Eze" },
  },
  {
    id: "APP-10235",
    status: "school_approved",
    amount: 180000,
    createdAt: "2025-06-12T00:00:00Z",
    student: { firstName: "Yusuf", lastName: "Ibrahim" },
    parent: { firstName: "Mr.", lastName: "Yusuf Ibrahim" },
  },
  {
    id: "APP-10234",
    status: "disbursed",
    amount: 150000,
    createdAt: "2025-06-12T00:00:00Z",
    student: { firstName: "Chidi", lastName: "Okafor" },
    parent: { firstName: "Mrs.", lastName: "Okafor" },
  },
  {
    id: "APP-10234",
    status: "disbursed",
    amount: 150000,
    createdAt: "2025-09-01T00:00:00Z",
    student: { firstName: "Chidi", lastName: "Okafor" },
    parent: { firstName: "Mrs.", lastName: "Okafor" },
  },
  {
    id: "APP-10234",
    status: "school_approved",
    amount: 200000,
    createdAt: "2025-09-16T00:00:00Z",
    student: { firstName: "Chidi", lastName: "Okafor" },
    parent: { firstName: "Mrs.", lastName: "Okafor" },
  },
];

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "—";

// ── Page ──────────────────────────────────────────────────────────────────────

const SchoolApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await schoolService.getApplications();
      const arr = Array.isArray(data)
        ? data
        : ((data as { applications?: AppRecord[] })?.applications ?? []);
      setApplications(
        (arr as AppRecord[]).length ? (arr as AppRecord[]) : STATIC_APPS,
      );
    } catch {
      setApplications(STATIC_APPS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = applications.filter((a) => {
    const matchStatus =
      statusFilter === "All Status" ||
      statusOf(a.status).label.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      a.id?.toLowerCase().includes(q) ||
      a.student?.firstName?.toLowerCase().includes(q) ||
      a.student?.lastName?.toLowerCase().includes(q) ||
      a.parent?.firstName?.toLowerCase().includes(q) ||
      a.parent?.lastName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout sidebar={<SchoolSidebar />} header={<SchoolTopBar />}>
      <div className="max-w-3xl mx-auto pt-8 space-y-6 animate-fade-in-up">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Applications</h1>
            <p className="text-sm text-brand">
              Review and manage tuition loan applications
            </p>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                type="text"
                placeholder="-Search by name or application ID-"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-brand text-white text-sm font-semibold pl-4 pr-9 py-2.5 rounded-lg focus:outline-none cursor-pointer"
              >
                {["All Status", "Pending", "Verified", "Completed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Icon
                name="filter"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Application list */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">
            Application List
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_40px] px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                <span>Student Name</span>
                <span>Parent Name</span>
                <span>Application ID</span>
                <span>Status</span>
                <span>Date</span>
                <span>View</span>
              </div>

              {visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No applications found.
                </div>
              ) : (
                visible.map((a, i) => {
                  const { label, cls } = statusOf(a.status);
                  return (
                    <div
                      key={`${a.id}-${i}`}
                      className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_40px] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-slate-800">
                        {a.student?.firstName} {a.student?.lastName}
                      </span>
                      <span className="text-sm text-slate-600">
                        {a.parent?.firstName} {a.parent?.lastName}
                      </span>
                      <span className="text-sm font-mono text-slate-500">
                        {a.id}
                      </span>
                      <span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cls}`}
                        >
                          {label}
                        </span>
                      </span>
                      <span className="text-sm text-slate-500">
                        {fmtDate(a.createdAt)}
                      </span>
                      <Icon
                        name="chevron-right"
                        className="w-4 h-4 text-slate-400"
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolApplicationsPage;
