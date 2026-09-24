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

interface DisbursementRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  disbursedAt: string | null;
  disbursementReference: string | null;
  paystackReference: string | null;
  recipientBankName: string | null;
  recipientAccountName: string | null;
  recipientAccountNumber: string | null;
  createdAt: string;
  loanApplication?: {
    id: string;
    referenceNumber?: string | null;
    amountRequested?: number;
    status?: string;
    student?: {
      firstName?: string;
      lastName?: string;
      gradeLevel?: string;
      studentId?: string | null;
    };
  };
}

interface Summary {
  totalDisbursed: number;
  pendingDisbursement: number;
  lastPaymentDate: string | null;
}

const DISB_STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  successful: {
    label: "Completed",
    bg: "#E8F7F1",
    text: "#087F5B",
    border: "#B7E5D4",
  },
  pending: {
    label: "Pending",
    bg: "#FFF7E6",
    text: "#B76E00",
    border: "#FFE1A8",
  },
  processing: {
    label: "Processing",
    bg: "#EAF2FF",
    text: "#2563EB",
    border: "#C7DCFF",
  },
  failed: {
    label: "Failed",
    bg: "#FDECEC",
    text: "#C62828",
    border: "#F5C2C2",
  },
  reversed: {
    label: "Reversed",
    bg: "#F1F5F9",
    text: "#64748B",
    border: "#CBD5E1",
  },
};

const disbStatusOf = (s: string) =>
  DISB_STATUS_MAP[s] ?? {
    label: s,
    bg: "#F1F5F9",
    text: "#64748B",
    border: "#CBD5E1",
  };

const fmt = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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

const SummaryCard: React.FC<{
  label: string;
  value: string;
  icon: string;
  accent: string;
}> = ({ label, value, icon, accent }) => (
  <div className="flex-1 flex flex-col items-center text-center px-4 py-2">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
      style={{ backgroundColor: `${accent}20` }}
    >
      <Icon name={icon} className="w-5 h-5" style={{ color: accent }} />
    </div>
    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
    <p className="text-lg font-extrabold text-slate-900">{value}</p>
  </div>
);

const SchoolDisbursementPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalDisbursed: 0,
    pendingDisbursement: 0,
    lastPaymentDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p = 1, l = limit, s = statusFilter, silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const apiStatus =
          s === "All"
            ? ""
            : s === "Completed"
              ? "successful"
              : s === "Pending"
                ? "pending"
                : s === "Processing"
                  ? "processing"
                  : s === "Failed"
                    ? "failed"
                    : "";

        const data = await (
          schoolService.getDisbursements as (
            p: number,
            l: number,
            status: string,
          ) => Promise<unknown>
        )(p, l, apiStatus);

        const d = data as {
          disbursements?: DisbursementRecord[];
          summary?: Summary;
          pagination?: { total: number; totalPages: number; page: number };
        };

        setDisbursements(d.disbursements ?? []);
        if (d.summary) setSummary(d.summary);
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
    [limit, statusFilter],
  );

  useEffect(() => {
    load(1, limit, statusFilter);
  }, [limit, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  const STATUS_TABS = ["All", "Completed", "Pending", "Processing", "Failed"];

  const visible = disbursements.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const studentName =
      `${d.loanApplication?.student?.firstName ?? ""} ${d.loanApplication?.student?.lastName ?? ""}`.toLowerCase();
    const ref = (d.loanApplication?.referenceNumber ?? "").toLowerCase();
    const disbRef = (d.disbursementReference ?? "").toLowerCase();
    return studentName.includes(q) || ref.includes(q) || disbRef.includes(q);
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
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Disbursement
          </h1>
          <p className="text-sm text-brand mt-0.5">
            Track all tuition payments sent to your school
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <SummaryCard
              label="Total Disbursed"
              value={fmt(summary.totalDisbursed)}
              icon="banknote"
              accent="#087F5B"
            />
            <SummaryCard
              label="Pending Disbursement"
              value={fmt(summary.pendingDisbursement)}
              icon="clock"
              accent="#B76E00"
            />
            <SummaryCard
              label="Last Payment"
              value={fmtDate(summary.lastPaymentDate)}
              icon="calendar-check"
              accent="#2563EB"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search student, reference…"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Icon
                          name="credit-card"
                          className="w-7 h-7 text-slate-300"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        No disbursements found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchInput || statusFilter !== "All"
                          ? "Try adjusting your search or filter."
                          : "Disbursements will appear here once processed."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visible.map((d) => {
                    const st = disbStatusOf(d.status);
                    const appId = d.loanApplication?.id ?? "";
                    const studentName =
                      `${d.loanApplication?.student?.firstName ?? ""} ${d.loanApplication?.student?.lastName ?? ""}`.trim() ||
                      "—";
                    const refDisplay =
                      d.loanApplication?.referenceNumber ??
                      d.disbursementReference ??
                      d.id.slice(0, 12).toUpperCase();
                    const dateDisplay = d.disbursedAt
                      ? fmtDate(d.disbursedAt)
                      : fmtDate(d.createdAt);

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold text-xs">
                              {(
                                d.loanApplication?.student?.firstName?.[0] ??
                                "?"
                              ).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {studentName}
                              </p>
                              {d.loanApplication?.student?.gradeLevel && (
                                <p className="text-xs text-slate-400">
                                  {d.loanApplication.student.gradeLevel}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-mono text-slate-500">
                          {refDisplay}
                        </td>
                        <td className="py-3.5 px-5 text-sm font-semibold text-slate-700">
                          {fmt(d.amount)}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            style={{
                              backgroundColor: st.bg,
                              color: st.text,
                              borderColor: st.border,
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">
                          {dateDisplay}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <ActionMenu
                            applicationId={appId}
                            onView={() => {
                              if (appId)
                                navigate(`/school/applications/${appId}`);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-4 pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => load(p, limit, statusFilter)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDisbursementPage;
