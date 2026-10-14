import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND, PAGE_SIZES, initials, fmtDate, useDebounce,
  SearchIcon, ChevronDown, ResetIcon, Pagination,
} from "./components/shared";

interface ParentRow {
  id: string;
  firstName: string;
  lastName: string;
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  employerType: string | null;
  monthlyIncome: string | null;
  createdAt: string;
  user: { email: string; phoneNumber: string | null; isActive: boolean };
  documents?: { id: string }[];
}

interface PageMeta { total: number; page: number; limit: number; }

interface KycStats {
  pending: number;
  submitted: number;
  approved: number;
  rejected: number;
}

const KYC_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  approved:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Approved"  },
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Pending"   },
  submitted: { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Submitted" },
  rejected:  { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500",    label: "Rejected"  },
};

const KycBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = KYC_CONFIG[status] ?? KYC_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-current/20 ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d={icon} />
      </svg>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const KYC_FILTER_OPTIONS = [
  { label: "All KYC",   value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Pending",   value: "pending" },
  { label: "Approved",  value: "approved" },
  { label: "Rejected",  value: "rejected" },
];

const AdminCompliancePage: React.FC = () => {
  const navigate = useNavigate();

  const [search,     setSearch]     = useState("");
  const [kycFilter,  setKycFilter]  = useState("submitted");
  const [page,       setPage]       = useState(1);
  const [limit,      setLimit]      = useState(25);
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");

  const [rows,    setRows]    = useState<ParentRow[]>([]);
  const [meta,    setMeta]    = useState<PageMeta>({ total: 0, page: 1, limit: 25 });
  const [stats,   setStats]   = useState<KycStats>({ pending: 0, submitted: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchStats = useCallback(async () => {
    try {
      const statuses = ["pending", "submitted", "approved", "rejected"] as const;
      const counts = await Promise.all(
        statuses.map(s =>
          apiClient.get<{ data: { total: number } }>(`/admin/parents?kycStatus=${s}&limit=1`)
            .then(r => r.data.data.total)
            .catch(() => 0)
        )
      );
      setStats({ pending: counts[0], submitted: counts[1], approved: counts[2], rejected: counts[3] });
    } catch { /* non-critical */ }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (kycFilter)       params.set("kycStatus", kycFilter);
      if (dateFrom)        params.set("fromDate", dateFrom);
      if (dateTo)          params.set("toDate", dateTo + "T23:59:59");
      params.set("page",  String(page));
      params.set("limit", String(limit));

      const res = await apiClient.get<{
        data: { total: number; page: number; limit: number; data: ParentRow[] };
      }>(`/admin/parents?${params}`);
      setRows(res.data.data.data);
      setMeta({ total: res.data.data.total, page: res.data.data.page, limit: res.data.data.limit });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, kycFilter, page, limit, dateFrom, dateTo]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(1); }, [debouncedSearch, kycFilter, dateFrom, dateTo]);

  const handleKycAction = async (parentId: string, status: "approved" | "rejected") => {
    setActionLoading(parentId);
    try {
      await apiClient.patch(`/admin/parents/${parentId}/kyc`, { kycStatus: status });
      toastSuccess(`KYC ${status === "approved" ? "approved" : "rejected"}.`);
      fetchRows();
      fetchStats();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));
  const isLoading = (id: string) => actionLoading === id;

  return (
    <>
      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">KYC review queue · approve or reject parent identity verifications</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Pending Review"
            value={stats.pending}
            icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Submitted"
            value={stats.submitted}
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            color="bg-green-50 text-green-600"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            color="bg-red-50 text-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          <div className="relative">
            <select
              value={kycFilter}
              onChange={e => setKycFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {KYC_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
          />
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
          />

          <div className="relative">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          {(search || kycFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setKycFilter("submitted"); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          )}
        </div>

        {/* KYC review card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                      <div className="h-3 w-3/4 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <p className="col-span-full py-16 text-center text-sm text-red-500">{error}</p>
          ) : rows.length === 0 ? (
            <p className="col-span-full py-16 text-center text-sm text-gray-400">No records match the current filters.</p>
          ) : (
            rows.map(row => (
              <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">

                {/* Card header: avatar + name/email */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: BRAND }}
                  >
                    {initials(row.firstName, row.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => navigate(`/admin/parents/${row.id}`)}
                      className="font-semibold text-gray-900 hover:text-[#7A0E42] hover:underline text-left leading-tight"
                    >
                      {row.firstName} {row.lastName}
                    </button>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{row.user?.email}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-gray-500 text-xs">KYC</span>
                  <KycBadge status={row.kycStatus} />

                  <span className="text-gray-500 text-xs">Employer</span>
                  <span className="text-gray-700 text-xs">{row.employerType ?? "—"}</span>

                  <span className="text-gray-500 text-xs">Income</span>
                  <span className="text-gray-700 text-xs">{row.monthlyIncome ?? "—"}</span>

                  <span className="text-gray-500 text-xs">Docs</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: (row.documents?.length ?? 0) > 0 ? BRAND : "#9ca3af" }}
                  >
                    {row.documents?.length ?? 0}
                  </span>

                  <span className="text-gray-500 text-xs">Date</span>
                  <span className="text-gray-700 text-xs">{fmtDate(row.createdAt)}</span>
                </div>

                {/* Actions footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  {row.kycStatus !== "approved" && (
                    <button
                      onClick={() => handleKycAction(row.id, "approved")}
                      disabled={isLoading(row.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading(row.id) ? (
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                      Approve
                    </button>
                  )}
                  {row.kycStatus !== "rejected" && (
                    <button
                      onClick={() => handleKycAction(row.id, "rejected")}
                      disabled={isLoading(row.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/parents/${row.id}`)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && rows.length > 0 && (
          <Pagination meta={meta} page={page} totalPages={totalPages} label="records" onPage={setPage} />
        )}
      </div>
    </>
  );
};

export default AdminCompliancePage;
