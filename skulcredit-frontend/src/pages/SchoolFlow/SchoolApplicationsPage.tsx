import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import { useSocket } from "../../context/SocketContext";

interface AppRecord {
  id: string;
  status: string;
  amountRequested?: number;
  serviceChargeAmount?: number | null;
  serviceChargeRate?: number | null;
  tenor?: number;
  createdAt?: string;
  updatedAt?: string;
  referenceNumber?: string;
  rejectionReason?: string | null;
  adminNote?: string | null;
  student?: {
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    studentId?: string;
    tuitionAmount?: number;
  };
  parent?: { firstName?: string; lastName?: string; email?: string };
  events?: {
    id?: string;
    status?: string;
    note?: string | null;
    createdAt?: string;
    actor?: string;
  }[];
  [key: string]: unknown;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  school_verification: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  pending_school_approval: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  under_review: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  school_approved: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  approved: {
    label: "Approved",
    cls: "bg-green-50 text-green-600 border border-green-200",
  },
  disbursed: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-50 text-red-600 border border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
  },
};

const statusOf = (s: string) =>
  STATUS_MAP[s] ?? {
    label: s.replace(/_/g, " "),
    cls: "bg-slate-100 text-slate-600 border border-slate-200",
  };

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "—";

const fmt = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const isPending = (s: string) =>
  ["pending", "school_verification", "pending_school_approval"].includes(s);

const SchoolApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [newCount, setNewCount] = useState(0);
  const loadedOnceRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await schoolService.getApplications();
      const arr = Array.isArray(data)
        ? data
        : ((data as { applications?: AppRecord[] })?.applications ?? []);
      setApplications(arr as AppRecord[]);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().then(() => {
      loadedOnceRef.current = true;
    });
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n: { referenceType?: string }) => {
      if (n.referenceType !== "loan_application") return;
      setNewCount((c) => c + 1);
      load(true);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, load]);

  const STATUS_TABS = [
    "All",
    "Pending",
    "Accepted",
    "Approved",
    "Completed",
    "Rejected",
  ];

  const visible = applications.filter((a) => {
    const { label } = statusOf(a.status);
    const matchStatus =
      statusFilter === "All" ||
      label.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (a.referenceNumber?.toLowerCase().includes(q) ?? false) ||
      (a.id?.toLowerCase().includes(q) ?? false) ||
      (a.student?.firstName?.toLowerCase().includes(q) ?? false) ||
      (a.student?.lastName?.toLowerCase().includes(q) ?? false) ||
      (a.parent?.firstName?.toLowerCase().includes(q) ?? false) ||
      (a.parent?.lastName?.toLowerCase().includes(q) ?? false);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout
      sidebar={
        <SchoolSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={<SchoolTopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />}
    >
      <div className="pt-8 pb-12 space-y-6 animate-fade-in-up w-[90%] mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Applications
            </h1>
            <p className="text-sm text-brand mt-0.5">
              Review and manage tuition loan applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <button
                onClick={() => setNewCount(0)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand text-white text-xs font-bold animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                {newCount} new
              </button>
            )}
            <span className="text-sm text-slate-500">
              {applications.length} total
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by student name, parent or reference ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  statusFilter === tab
                    ? "bg-brand text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_36px] px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50">
            <span>Student</span>
            <span>Parent</span>
            <span>Ref / ID</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="file-text" className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No applications found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Applications from parents will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((a, i) => {
                const { label, cls } = statusOf(a.status);
                const studentName =
                  `${a.student?.firstName ?? ""} ${a.student?.lastName ?? ""}`.trim() ||
                  "—";
                const parentName =
                  `${a.parent?.firstName ?? ""} ${a.parent?.lastName ?? ""}`.trim() ||
                  "—";
                const refDisplay =
                  a.referenceNumber ?? a.id.slice(0, 12).toUpperCase();
                const pending = isPending(a.status);

                return (
                  <React.Fragment key={`${a.id}-${i}`}>
                    <div
                      onClick={() => navigate(`/school/applications/${a.id}`)}
                      className={`hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_36px] items-center px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        pending ? "border-l-4 border-l-amber-400" : ""
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {studentName}
                      </span>
                      <span className="text-sm text-slate-600 truncate">
                        {parentName}
                      </span>
                      <span className="text-sm font-mono text-slate-500 truncate">
                        {refDisplay}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {fmt(a.amountRequested)}
                      </span>
                      <span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
                        >
                          {pending && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                          {label}
                        </span>
                      </span>
                      <span className="text-sm text-slate-500">
                        {fmtDate(a.createdAt)}
                      </span>
                      <Icon
                        name="chevron-right"
                        className="w-4 h-4 text-slate-400 justify-self-end"
                      />
                    </div>

                    <div
                      onClick={() => navigate(`/school/applications/${a.id}`)}
                      className="sm:hidden flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold text-sm">
                        {(a.student?.firstName?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {studentName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {parentName} · {refDisplay}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
                        >
                          {label}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {fmtDate(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolApplicationsPage;
