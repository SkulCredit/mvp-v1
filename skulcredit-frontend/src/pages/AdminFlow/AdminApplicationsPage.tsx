import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND,
  PAGE_SIZES,
  fmtDate,
  useDebounce,
  SearchIcon,
  ChevronDown,
  ResetIcon,
  ActionsDropdown,
  Spinner,
  EmptyRow,
  ErrorRow,
  Pagination,
} from "./components/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

type LoanApplicationStatus =
  | "pending"
  | "under_review"
  | "info_requested"
  | "school_verification"
  | "approved"
  | "rejected"
  | "disbursed"
  | "repaid"
  | "cancelled";

interface AppRow {
  id: string;
  referenceNumber: string;
  status: LoanApplicationStatus;
  amountRequested: number;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
  catalogSchool: { id: string; name: string; isRegistered?: boolean };
  parent: { id: string; firstName: string; lastName: string };
}

interface PageMeta {
  total: number;
  page: number;
  limit: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LoanApplicationStatus, string> = {
  pending: "border border-amber-300 text-amber-700 bg-amber-50",
  under_review: "border border-blue-300 text-blue-700 bg-blue-50",
  info_requested: "border border-orange-300 text-orange-700 bg-orange-50",
  school_verification: "border border-purple-300 text-purple-700 bg-purple-50",
  approved: "border border-green-300 text-green-700 bg-green-50",
  rejected: "border border-red-300 text-red-600 bg-red-50",
  disbursed: "border border-indigo-300 text-indigo-700 bg-indigo-50",
  repaid: "border border-teal-300 text-teal-700 bg-teal-50",
  cancelled: "border border-gray-300 text-gray-500 bg-gray-50",
};

const STATUS_LABEL: Record<LoanApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  info_requested: "Info Requested",
  school_verification: "School Verification",
  approved: "Approved",
  rejected: "Rejected",
  disbursed: "Disbursed",
  repaid: "Repaid",
  cancelled: "Cancelled",
};

const StatusBadge: React.FC<{ status: LoanApplicationStatus }> = ({
  status,
}) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[status] ?? "border border-gray-200 text-gray-500"}`}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_FILTER: { label: string; value: string }[] = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Info Requested", value: "info_requested" },
  { label: "School Verification", value: "school_verification" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Disbursed", value: "disbursed" },
  { label: "Repaid", value: "repaid" },
  { label: "Cancelled", value: "cancelled" },
];

const COLS = [
  "REFERENCE",
  "APPLICANT",
  "SCHOOL",
  "AMOUNT",
  "STATUS",
  "DATE",
  "ACTIONS",
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters / pagination state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "",
  );
  const [unknownSchoolFilter, setUnknownSchoolFilter] = useState(
    () => searchParams.get("unknownSchool") === "true",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sync statusFilter whenever the URL ?status= param changes externally
  // (e.g. clicking a sidebar link while already on this page)
  useEffect(() => {
    const urlStatus = searchParams.get("status") ?? "";
    setStatusFilter(urlStatus);
    setPage(1);
  }, [searchParams]);

  // Data state
  const [rows, setRows] = useState<AppRow[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<AppRow | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (unknownSchoolFilter) params.set("isUnknownSchool", "true");
      if (dateFrom) params.set("fromDate", dateFrom);
      if (dateTo) params.set("toDate", dateTo + "T23:59:59");
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await apiClient.get<{
        data: { total: number; page: number; limit: number; data: AppRow[] };
      }>(`/admin/loans?${params}`);

      const envelope = res.data.data;
      let data = envelope.data;

      // Client-side search filter by reference, parent name, school name
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        data = data.filter(
          (r) =>
            r.referenceNumber.toLowerCase().includes(q) ||
            `${r.parent.firstName} ${r.parent.lastName}`
              .toLowerCase()
              .includes(q) ||
            r.catalogSchool.name.toLowerCase().includes(q),
        );
      }

      setRows(data);
      setMeta({
        total: envelope.total,
        page: envelope.page,
        limit: envelope.limit,
      });
    } catch (err) {
      setError(
        (err as { message?: string }).message ?? "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    unknownSchoolFilter,
    page,
    limit,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, unknownSchoolFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));

  // Cancel (status → cancelled) action
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await apiClient.patch(`/admin/loans/${cancelTarget.id}/status`, {
        status: "cancelled",
      });
      toastSuccess(`Application ${cancelTarget.referenceNumber} cancelled.`);
      setCancelTarget(null);
      fetchApplications();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Cancel failed.");
    } finally {
      setCancelLoading(false);
    }
  };

  const anyFilterActive = !!(
    search ||
    statusFilter ||
    unknownSchoolFilter ||
    dateFrom ||
    dateTo
  );

  return (
    <>
      {/* ── Cancel confirmation modal ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelTarget(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-amber-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Cancel Application?
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Application{" "}
              <span className="font-semibold text-gray-700">
                {cancelTarget.referenceNumber}
              </span>{" "}
              will be set to cancelled. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelLoading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {cancelLoading ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page layout ── */}
      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Loan application records · use filters to narrow results
          </p>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, parent, school…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSearchParams(
                  (prev) => {
                    if (val) prev.set("status", val);
                    else prev.delete("status");
                    return prev;
                  },
                  { replace: true },
                );
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {STATUS_FILTER.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="From date"
          />

          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="To date"
          />

          {/* Page size */}
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              const next = !unknownSchoolFilter;
              setUnknownSchoolFilter(next);
              setSearchParams(
                (prev) => {
                  if (next) prev.set("unknownSchool", "true");
                  else prev.delete("unknownSchool");
                  return prev;
                },
                { replace: true },
              );
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              unknownSchoolFilter
                ? "bg-amber-50 border-amber-400 text-amber-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
            }`}
          >
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Unknown Schools
            {unknownSchoolFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          {anyFilterActive && (
            <button
              onClick={() => {
                setSearch("");
                setUnknownSchoolFilter(false);
                setDateFrom("");
                setDateTo("");
                setPage(1);
                setSearchParams({}, { replace: true });
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {COLS.map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Spinner cols={COLS.length} />
                ) : error ? (
                  <ErrorRow cols={COLS.length} message={error} />
                ) : rows.length === 0 ? (
                  <EmptyRow
                    cols={COLS.length}
                    label="No applications found. Try adjusting your filters."
                  />
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/admin/applications/${row.id}`)}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {/* Reference */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: BRAND }}
                        >
                          {row.referenceNumber}
                        </span>
                      </td>

                      {/* Applicant (parent) */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row.parent.firstName} {row.parent.lastName}
                      </td>

                      {/* School */}
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {row.catalogSchool.name}
                        {row.catalogSchool.isRegistered === false && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 whitespace-nowrap">
                            Unknown
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₦{row.amountRequested.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fmtDate(row.createdAt)}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionsDropdown
                          onView={() =>
                            navigate(`/admin/applications/${row.id}`)
                          }
                          onDelete={() => setCancelTarget(row)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && rows.length > 0 && (
            <Pagination
              meta={meta}
              page={page}
              totalPages={totalPages}
              label="applications"
              onPage={setPage}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminApplicationsPage;
