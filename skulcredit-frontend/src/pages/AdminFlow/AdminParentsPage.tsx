import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND, PAGE_SIZES, initials, fmtDate, useDebounce,
  SearchIcon, ChevronDown, ResetIcon, PlusIcon,
  ActionsDropdown, Spinner, EmptyRow, ErrorRow, Pagination,
} from "./components/shared";
import ParentFormModal, { ParentFormData } from "./components/ParentFormModal";

interface ParentRow {
  id: string;
  firstName: string;
  lastName: string;
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  relationship: string | null;
  employerType: string | null;
  monthlyIncome: string | null;
  createdAt: string;
  user: {
    email: string;
    phoneNumber: string | null;
    isActive: boolean;
  };
  loanApplications?: { id: string }[];
}

interface PageMeta { total: number; page: number; limit: number; }

const KYC_BADGE: Record<string, string> = {
  approved:  "border border-gray-300 text-gray-700",
  pending:   "border border-amber-300 text-amber-700 bg-amber-50",
  submitted: "border border-blue-300 text-blue-700 bg-blue-50",
  rejected:  "border border-red-300 text-red-600 bg-red-50",
};
const KYC_LABEL: Record<string, string> = {
  approved: "Verified", pending: "Pending", submitted: "Submitted", rejected: "Rejected",
};

const KycBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${KYC_BADGE[status] ?? KYC_BADGE.pending}`}>
    {KYC_LABEL[status] ?? status}
  </span>
);

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
    active ? "border border-gray-300 text-gray-700" : "border border-red-300 text-red-600 bg-red-50"
  }`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const KYC_OPTIONS = [
  { label: "All KYC",   value: "" },
  { label: "Verified",  value: "approved" },
  { label: "Pending",   value: "pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Rejected",  value: "rejected" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active",     value: "active" },
  { label: "Inactive",   value: "inactive" },
];

const TABS = [
  { key: "all",       label: "All" },
  { key: "duplicate", label: "Potential Duplicate" },
  { key: "mismatch",  label: "KYC Mismatch" },
  { key: "onhold",    label: "On hold" },
] as const;
type TabKey = typeof TABS[number]["key"];

const COLS = ["PARENT", "DATE REGISTERED", "KYC", "STATUS", "PHONE", "APPLICATIONS", "ACTIONS"];

const AdminParentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState("");
  const [kycFilter,    setKycFilter]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab,    setActiveTab]    = useState<TabKey>("all");
  const [page,         setPage]         = useState(1);
  const [limit,        setLimit]        = useState(10);
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");

  const [deleteTarget,  setDeleteTarget]  = useState<ParentRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rows,    setRows]    = useState<ParentRow[]>([]);
  const [meta,    setMeta]    = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [formOpen,   setFormOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<ParentRow | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchParents = useCallback(async () => {
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

      let data = res.data.data.data;
      if (statusFilter === "active")   data = data.filter(r => r.user?.isActive);
      if (statusFilter === "inactive") data = data.filter(r => !r.user?.isActive);

      setRows(data);
      setMeta({ total: res.data.data.total, page: res.data.data.page, limit: res.data.data.limit });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load parents");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, kycFilter, statusFilter, page, limit, dateFrom, dateTo]);

  useEffect(() => { fetchParents(); }, [fetchParents]);
  useEffect(() => { setPage(1); }, [debouncedSearch, kycFilter, statusFilter, activeTab, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/parents/${deleteTarget.id}`);
      setDeleteTarget(null);
      toastSuccess(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted.`);
      fetchParents();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit   = (row: ParentRow) => { setEditTarget(row); setFormOpen(true); };

  const handleSave = async (data: ParentFormData) => {
    setFormSaving(true);
    try {
      if (editTarget) {
        if (data.kycStatus) {
          await apiClient.patch(`/admin/parents/${editTarget.id}/kyc`, { kycStatus: data.kycStatus });
        }
        await apiClient.patch(`/admin/parents/${editTarget.id}/eligibility-profile`, {
          phoneNumber:   data.phoneNumber  || undefined,
          employerType:  data.employerType || undefined,
          monthlyIncome: data.monthlyIncome || undefined,
        });
      } else {
        await apiClient.post("/auth/register/parent", {
          firstName:   data.firstName,
          lastName:    data.lastName,
          email:       data.email,
          password:    data.password,
          phoneNumber: data.phoneNumber,
        });
      }
      setFormOpen(false);
      toastSuccess(editTarget ? "Parent updated." : "Parent created.");
      fetchParents();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Save failed.");
    } finally {
      setFormSaving(false);
    }
  };

  const TAB_COUNTS = { all: meta.total, duplicate: 0, mismatch: 0, onhold: 0 };

  return (
    <>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
             role="dialog" aria-modal="true"
             onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500">
                  <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-900">Delete Parent Account?</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">{deleteTarget.firstName} {deleteTarget.lastName}</span> will be permanently removed.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleteLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ParentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editTarget ? {
          firstName:    editTarget.firstName,
          lastName:     editTarget.lastName,
          email:        editTarget.user?.email,
          phoneNumber:  editTarget.user?.phoneNumber ?? "",
          kycStatus:    editTarget.kycStatus,
          relationship: editTarget.relationship ?? "",
          employerType: editTarget.employerType ?? "",
          monthlyIncome: editTarget.monthlyIncome ?? "",
        } : undefined}
        onSave={handleSave}
        saving={formSaving}
      />

      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Parent &amp; guardian accounts · click a row for the full profile
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 transition-colors"
            style={{ backgroundColor: BRAND }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}
          >
            <PlusIcon /> Add Parent
          </button>
        </div>

        <div className="flex items-end gap-6 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={["pb-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap",
                      activeTab === t.key ? "border-[#7A0E42] text-[#7A0E42]" : "border-transparent text-gray-500 hover:text-gray-700"].join(" ")}>
              {t.label}
              <span className={["text-xs font-bold", activeTab === t.key ? "text-[#7A0E42]" : "text-gray-400"].join(" ")}>
                {TAB_COUNTS[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search by reference, parent..."
                   className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" />
          </div>

          <div className="relative">
            <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer">
              {KYC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="To date"
          />

          <div className="relative">
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          {(search || kycFilter || statusFilter || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(""); setKycFilter(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors">
              <ResetIcon /> Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {COLS.map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <Spinner cols={COLS.length} /> :
                 error   ? <ErrorRow cols={COLS.length} message={error} /> :
                 rows.length === 0 ? <EmptyRow cols={COLS.length} label="No parents found. Try adjusting your filters." /> :
                 rows.map(row => (
                  <tr key={row.id} onClick={() => navigate(`/admin/parents/${row.id}`)}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                             style={{ backgroundColor: BRAND }}>
                          {initials(row.firstName, row.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{row.firstName} {row.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{row.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                    <td className="px-5 py-4"><KycBadge status={row.kycStatus} /></td>
                    <td className="px-5 py-4"><StatusBadge active={row.user?.isActive ?? false} /></td>
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{row.user?.phoneNumber ?? "—"}</td>
                    <td className="px-5 py-4 text-sm font-bold whitespace-nowrap"
                        style={{ color: (row.loanApplications?.length ?? 0) > 0 ? BRAND : "#9ca3af" }}>
                      {row.loanApplications?.length ?? 0}
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <ActionsDropdown
                        onView={() => navigate(`/admin/parents/${row.id}`)}
                        onEdit={() => openEdit(row)}
                        onDelete={() => setDeleteTarget(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-gray-50">
            {loading ? (
              <div className="py-16 flex justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                     style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">No parents found.</p>
            ) : rows.map(row => (
              <div key={row.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                     style={{ backgroundColor: BRAND }}>
                  {initials(row.firstName, row.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{row.firstName} {row.lastName}</p>
                  <p className="text-xs text-gray-400">{row.user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <KycBadge status={row.kycStatus} />
                    <StatusBadge active={row.user?.isActive ?? false} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{row.user?.phoneNumber ?? "—"}</p>
                </div>
                <ActionsDropdown
                  onView={() => navigate(`/admin/parents/${row.id}`)}
                  onEdit={() => openEdit(row)}
                  onDelete={() => setDeleteTarget(row)}
                />
              </div>
            ))}
          </div>

          {!loading && rows.length > 0 && (
            <Pagination meta={meta} page={page} totalPages={totalPages} label="parents" onPage={setPage} />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminParentsPage;
