import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Pagination from "../../components/ui/Pagination";
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

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending",
    bg: "#FFF7E6",
    text: "#B76E00",
    border: "#FFE1A8",
  },
  school_verification: {
    label: "Pending",
    bg: "#FFF7E6",
    text: "#B76E00",
    border: "#FFE1A8",
  },
  pending_school_approval: {
    label: "Pending",
    bg: "#FFF7E6",
    text: "#B76E00",
    border: "#FFE1A8",
  },
  under_review: {
    label: "Accepted",
    bg: "#EAF8F0",
    text: "#16794C",
    border: "#BCE8CF",
  },
  school_approved: {
    label: "Accepted",
    bg: "#EAF8F0",
    text: "#16794C",
    border: "#BCE8CF",
  },
  info_requested: {
    label: "Accepted",
    bg: "#EAF8F0",
    text: "#16794C",
    border: "#BCE8CF",
  },
  approved: {
    label: "Approved",
    bg: "#EAF2FF",
    text: "#2563EB",
    border: "#C7DCFF",
  },
  disbursed: {
    label: "Completed",
    bg: "#E8F7F1",
    text: "#087F5B",
    border: "#B7E5D4",
  },
  repaid: {
    label: "Completed",
    bg: "#E8F7F1",
    text: "#087F5B",
    border: "#B7E5D4",
  },
  rejected: {
    label: "Rejected",
    bg: "#FDECEC",
    text: "#C62828",
    border: "#F5C2C2",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#F1F5F9",
    text: "#64748B",
    border: "#CBD5E1",
  },
};

const statusOf = (s: string) =>
  STATUS_MAP[s] ?? {
    label: s.replace(/_/g, " "),
    bg: "#F1F5F9",
    text: "#64748B",
    border: "#CBD5E1",
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

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100, 500];

interface ActionMenuProps {
  applicationId: string;
  onView: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onView }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        Actions
        <Icon
          name="chevron-down"
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 z-30 overflow-hidden py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onView();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left"
          >
            <Icon name="eye" className="w-4 h-4 text-slate-400 shrink-0" />
            View Record
          </button>
        </div>
      )}
    </div>
  );
};

const SchoolApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [newCount, setNewCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const loadedOnceRef = useRef(false);

  const load = useCallback(
    async (p = 1, l = limit, silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await (
          schoolService.getApplications as (
            p: number,
            l: number,
          ) => Promise<unknown>
        )(p, l);
        const d = data as {
          applications?: AppRecord[];
          pagination?: { total: number; totalPages: number; page: number };
        };
        const arr = Array.isArray(data)
          ? (data as AppRecord[])
          : ((d.applications ?? []) as AppRecord[]);
        setApplications(arr);
        if (d.pagination) {
          setTotal(d.pagination.total);
          setTotalPages(d.pagination.totalPages);
          setPage(d.pagination.page);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    load(1, limit).then(() => {
      loadedOnceRef.current = true;
    });
  }, [load, limit]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n: { referenceType?: string }) => {
      if (n.referenceType !== "loan_application") return;
      setNewCount((c) => c + 1);
      load(page, limit, true);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, load, page, limit]);

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
            <span className="text-sm text-slate-500">{total} total</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">entries</span>
            </div>
            <div className="relative flex-1">
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
          <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px] px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50">
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
                const st = statusOf(a.status);
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
                      className={`hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px] items-center px-5 py-4 hover:bg-slate-50 transition-colors ${
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
                          style={{
                            backgroundColor: st.bg,
                            color: st.text,
                            borderColor: st.border,
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
                        >
                          {pending && (
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ backgroundColor: st.text }}
                            />
                          )}
                          {st.label}
                        </span>
                      </span>
                      <span className="text-sm text-slate-500">
                        {fmtDate(a.createdAt)}
                      </span>
                      <div className="flex justify-end">
                        <ActionMenu
                          applicationId={a.id}
                          onView={() =>
                            navigate(`/school/applications/${a.id}`)
                          }
                        />
                      </div>
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
                          style={{
                            backgroundColor: st.bg,
                            color: st.text,
                            borderColor: st.border,
                          }}
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border"
                        >
                          {st.label}
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

          <div className="px-5 pb-4 pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => load(p, limit)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolApplicationsPage;
