import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND, PAGE_SIZES, initials, fmtDate, useDebounce,
  SearchIcon, ChevronDown, ResetIcon, PlusIcon,
  ActionsDropdown, Spinner, EmptyRow, ErrorRow, Pagination,
  useClickOutside, Ic,
} from "./components/shared";
import SchoolFormModal, { SchoolFormData } from "./components/SchoolFormModal";

interface SchoolRow {
  id: string;
  schoolName: string;
  contactPerson: string;
  addressState: string | null;
  addressCity: string | null;
  addressStreet: string | null;
  website: string | null;
  population: string | null;
  status: "pending" | "under_review" | "approved" | "rejected";
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  logoUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string | null;
    isActive: boolean;
  };
  loanApplications?: { id: string }[];
}

interface PageMeta { total: number; page: number; limit: number; }

const STATUS_BADGE: Record<string, string> = {
  approved:     "bg-green-50 border border-green-200 text-green-700",
  pending:      "bg-amber-50 border border-amber-200 text-amber-700",
  under_review: "bg-blue-50 border border-blue-200 text-blue-700",
  rejected:     "bg-red-50 border border-red-200 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  approved: "Approved", pending: "Pending", under_review: "Under Review", rejected: "Rejected",
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status] ?? STATUS_BADGE.pending}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${
      status === "approved" ? "bg-green-500" :
      status === "rejected" ? "bg-red-500" :
      status === "under_review" ? "bg-blue-500" : "bg-amber-400"
    }`} />
    {STATUS_LABEL[status] ?? status}
  </span>
);

const STATUS_FILTER = [
  { label: "All Status",   value: "" },
  { label: "Approved",     value: "approved" },
  { label: "Pending",      value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Rejected",     value: "rejected" },
];

const TABS = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending Approval" },
  { key: "approved",  label: "Approved" },
  { key: "rejected",  label: "Rejected" },
] as const;

type TabKey = typeof TABS[number]["key"];

const DeleteModal: React.FC<{
  school: SchoolRow;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ school, loading, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    role="dialog"
    aria-modal="true"
    onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
  >
    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Ic
            d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]}
            cls="w-6 h-6 text-red-500"
          />
        </div>
      </div>

      <h2 className="text-base font-bold text-gray-900">Delete School Account?</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-700">{school.schoolName}</span> and all its
        associated data will be permanently removed. This action cannot be undone.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  </div>
);


const AdminSchoolsPage: React.FC = () => {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab,    setActiveTab]    = useState<TabKey>("all");
  const [page,         setPage]         = useState(1);
  const [limit,        setLimit]        = useState(10);
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");

  const [rows,    setRows]    = useState<SchoolRow[]>([]);
  const [meta,    setMeta]    = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [formOpen,    setFormOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<SchoolRow | null>(null);
  const [formSaving,  setFormSaving]  = useState(false);

  // Delete modal state
  const [deleteTarget,  setDeleteTarget]  = useState<SchoolRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tabStatus = activeTab !== "all" ? activeTab : statusFilter;
      const qs = new URLSearchParams();
      if (tabStatus) qs.set("status", tabStatus);
      const res = await apiClient.get<{ data: SchoolRow[] }>(`/admin/schools?${qs}`);
      let data = res.data.data;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        data = data.filter(r =>
          r.schoolName.toLowerCase().includes(q) ||
          r.user?.email?.toLowerCase().includes(q) ||
          r.contactPerson?.toLowerCase().includes(q)
        );
      }
      if (dateFrom) data = data.filter(r => r.createdAt >= dateFrom);
      if (dateTo)   data = data.filter(r => r.createdAt <= dateTo + "T23:59:59");
      const total = data.length;
      const sliced = data.slice((page - 1) * limit, page * limit);
      setRows(sliced);
      setMeta({ total, page, limit });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, activeTab, page, limit, dateFrom, dateTo]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, activeTab, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/schools/${deleteTarget.id}`);
      setDeleteTarget(null);
      toastSuccess(`"${deleteTarget.schoolName}" deleted successfully.`);
      fetchSchools();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit   = (row: SchoolRow) => { setEditTarget(row); setFormOpen(true); };

  const handleSave = async (data: SchoolFormData) => {
    setFormSaving(true);
    try {
      if (editTarget) {
        await apiClient.patch(`/admin/schools/${editTarget.id}`, data);
        toastSuccess("School updated successfully.");
      } else {
        await apiClient.post("/admin/schools", data);
        toastSuccess("School registered successfully.");
      }
      setFormOpen(false);
      fetchSchools();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Save failed.");
    } finally {
      setFormSaving(false);
    }
  };

  const COLS = ["SCHOOL", "STATE", "REGISTERED", "BANK ACCOUNT", "STATUS", "APPS", "ACTIONS"];

  return (
    <>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          school={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Create / Edit drawer */}
      <SchoolFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editTarget ? {
          schoolName:        editTarget.schoolName,
          contactPerson:     editTarget.contactPerson,
          email:             editTarget.user?.email ?? "",
          phoneNumber:       editTarget.user?.phoneNumber ?? "",
          website:           editTarget.website ?? "",
          population:        editTarget.population ?? "",
          addressStreet:     editTarget.addressStreet ?? "",
          addressCity:       editTarget.addressCity ?? "",
          addressState:      editTarget.addressState ?? "",
          bankName:          editTarget.bankName ?? "",
          bankAccountName:   editTarget.bankAccountName ?? "",
          bankAccountNumber: editTarget.bankAccountNumber ?? "",
          status:            editTarget.status,
          logoUrl:           editTarget.logoUrl ?? "",
        } : undefined}
        onSave={handleSave}
        saving={formSaving}
      />

      {/* ── Page content ── */}
      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
            <p className="text-sm text-gray-500 mt-1">
              Onboarding queue &amp; partner status · click a row for the full profile
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 transition-colors"
            style={{ backgroundColor: BRAND }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}
          >
            <PlusIcon /> Add School
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-end gap-1 sm:gap-4 border-b border-gray-200 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                "pb-3 px-1 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0",
                activeTab === t.key
                  ? "border-[#7A0E42] text-[#7A0E42]"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search school name, email…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          {activeTab === "all" && (
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
              >
                {STATUS_FILTER.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <ChevronDown />
              </span>
            </div>
          )}

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
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>

          {(search || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400 shrink-0">
            {meta.total} school{meta.total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {COLS.map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <Spinner cols={COLS.length} />
                  : error
                    ? <ErrorRow cols={COLS.length} message={error} />
                    : rows.length === 0
                      ? <EmptyRow cols={COLS.length} label="No schools found. Try adjusting your filters." />
                      : rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/admin/schools/${row.id}`)}
                      className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                            style={{ backgroundColor: BRAND }}
                          >
                            {row.logoUrl
                              ? <img src={row.logoUrl} alt={row.schoolName} className="w-full h-full object-cover" />
                              : initials(row.schoolName.split(" ")[0] ?? "S", row.schoolName.split(" ")[1] ?? "C")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{row.schoolName}</p>
                            <p className="text-xs text-gray-400 truncate">{row.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {row.addressState ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {row.bankAccountNumber
                          ? `${row.bankName ?? ""} ···${row.bankAccountNumber.slice(-4)}`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-sm font-bold whitespace-nowrap"
                          style={{ color: (row.loanApplications?.length ?? 0) > 0 ? BRAND : "#9ca3af" }}>
                        {row.loanApplications?.length ?? 0}
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <ActionsDropdown
                          onView={() => navigate(`/admin/schools/${row.id}`)}
                          onEdit={() => openEdit(row)}
                          onDelete={() => setDeleteTarget(row)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {loading ? (
              <div className="py-16 flex justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                     style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">No schools found.</p>
            ) : rows.map(row => (
              <div
                key={row.id}
                className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/admin/schools/${row.id}`)}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                     style={{ backgroundColor: BRAND }}>
                  {row.logoUrl
                    ? <img src={row.logoUrl} alt={row.schoolName} className="w-full h-full object-cover" />
                    : initials(row.schoolName.split(" ")[0] ?? "S", row.schoolName.split(" ")[1] ?? "C")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{row.schoolName}</p>
                  <p className="text-xs text-gray-400 truncate">{row.user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.addressCity && row.addressState
                      ? `${row.addressCity}, ${row.addressState}`
                      : row.addressState ?? "—"}
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <ActionsDropdown
                    onView={() => navigate(`/admin/schools/${row.id}`)}
                    onEdit={() => openEdit(row)}
                    onDelete={() => setDeleteTarget(row)}
                  />
                </div>
              </div>
            ))}
          </div>

          {!loading && rows.length > 0 && (
            <Pagination meta={meta} page={page} totalPages={totalPages} label="schools" onPage={setPage} />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSchoolsPage;
