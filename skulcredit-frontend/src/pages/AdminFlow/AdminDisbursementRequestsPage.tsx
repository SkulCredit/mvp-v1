import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND,
  PAGE_SIZES,
  fmtDate,
  SearchIcon,
  ChevronDown,
  Spinner,
  EmptyRow,
  ErrorRow,
  Pagination,
  DrawerShell,
} from "./components/shared";

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface DisbursementInfo {
  status: string;
  initiatedBy: string | null;
  disbursedAt: string | null;
  failureReason: string | null;
}

interface DisbursementRow {
  id: string;
  referenceNumber: string;
  status: string;
  disbursementStatus: string | null;
  amountApproved: string | null;
  amountRequested: string | null;
  serviceFeePaid: boolean;
  mandateStatus: string | null;
  rejectionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  parent: { firstName: string; lastName: string; email: string };
  student: { firstName: string; lastName: string; gradeLevel: string };
  school: { name: string };
  bankDetails: BankDetails | null;
  disbursement: DisbursementInfo | null;
  assignedPartnerName: string | null;
}

interface FundingPartnerContact {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string | null;
  isPrimary: boolean;
}

interface FundingPartnerOption {
  id: string;
  name: string;
  email: string;
  status: string;
  contacts: FundingPartnerContact[];
}

interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface KpiCounts {
  all: number;
  pending: number;
  completed: number;
  rejected: number;
}

function formatAmount(val: string | null | undefined): string {
  if (!val) return "—";
  const n = Number(val);
  if (isNaN(n)) return val;
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const AppStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "disbursed") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        Completed
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      Pending
    </span>
  );
};

const DisbStatusBadge: React.FC<{ row: DisbursementRow }> = ({ row }) => {
  if (row.disbursement?.status === "successful" || row.status === "disbursed") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        Completed
      </span>
    );
  }
  if (row.status === "rejected") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      Awaiting
    </span>
  );
};

interface AssignPartnerModalProps {
  app: DisbursementRow;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignPartnerModal: React.FC<AssignPartnerModalProps> = ({ app, onClose, onSuccess }) => {
  const [partners, setPartners] = useState<FundingPartnerOption[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: FundingPartnerOption[] }>("/admin/funding-partners")
      .then((res) => {
        setPartners((res.data.data ?? []).filter((p) => p.status === "active"));
      })
      .catch(() => setError("Failed to load funding partners."))
      .finally(() => setLoadingPartners(false));
  }, []);

  const chosenPartner = partners.find((p) => p.id === selectedPartnerId);
  const contacts = chosenPartner?.contacts ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      setError("Please select a funding partner.");
      return;
    }
    if (contacts.length > 1 && !selectedContactId) {
      setError("Please select a contact to notify.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/loans/${app.id}/assign-disbursement`, {
        fundingPartnerId: selectedPartnerId,
        ...(selectedContactId ? { contactId: selectedContactId } : {}),
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to assign partner.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">{app.assignedPartnerName ? "Reassign Funding Partner" : "Assign Funding Partner"}</h3>
        <p className="text-sm text-gray-500 mb-5">
          {app.assignedPartnerName ? `Reassign from ${app.assignedPartnerName} — select a new partner for` : "Select a partner to handle disbursement for"}{" "}
          <span className="font-semibold text-gray-700">{app.referenceNumber}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Funding Partner <span className="text-red-500">*</span>
            </label>
            {loadingPartners ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
                Loading partners…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => { setSelectedPartnerId(e.target.value); setSelectedContactId(""); setError(null); }}
                    className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 bg-white"
                  >
                    <option value="">— Select partner —</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronDown />
                  </span>
                </div>

                {chosenPartner && contacts.length === 1 && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Notify</p>
                    <p className="text-sm font-semibold text-gray-800">{contacts[0].fullName}</p>
                    <p className="text-xs text-gray-500">{contacts[0].position ?? contacts[0].email}</p>
                    <p className="text-xs text-gray-400 font-mono">{contacts[0].email}</p>
                  </div>
                )}

                {chosenPartner && contacts.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Select Contact to Notify <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedContactId}
                        onChange={(e) => { setSelectedContactId(e.target.value); setError(null); }}
                        className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 bg-white"
                      >
                        <option value="">— Select contact —</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName}{c.position ? ` — ${c.position}` : ""}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <ChevronDown />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any instructions for the funding partner…"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingPartners}
              className="flex-1 rounded-xl text-white font-bold py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning…
                </>
              ) : (
                app.assignedPartnerName ? "Reassign Partner" : "Assign Partner"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TABS = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "rejected",  label: "Rejected" },
] as const;
type TabKey = typeof TABS[number]["key"];

const COLS = [
  "APPLICATION REF",
  "PARENT / STUDENT",
  "SCHOOL",
  "AMOUNT",
  "BANK DETAILS",
  "STATUS",
  "ASSIGNED TO",
  "DATE",
  "ACTIONS",
];

const AdminDisbursementRequestsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<DisbursementRow[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kpiCounts, setKpiCounts] = useState<KpiCounts>({ all: 0, pending: 0, completed: 0, rejected: 0 });

  const [assignTarget, setAssignTarget] = useState<DisbursementRow | null>(null);
  const [viewTarget, setViewTarget] = useState<DisbursementRow | null>(null);

  const [drawerPartners, setDrawerPartners] = useState<FundingPartnerOption[]>([]);
  const [drawerPartnersLoading, setDrawerPartnersLoading] = useState(false);
  const [drawerSelectedPartner, setDrawerSelectedPartner] = useState("");
  const [drawerSelectedContact, setDrawerSelectedContact] = useState("");
  const [drawerAssigning, setDrawerAssigning] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  useEffect(() => {
    if (viewTarget && isPending(viewTarget)) {      setDrawerSelectedPartner("");
      setDrawerSelectedContact("");
      setDrawerError(null);
      setDrawerPartnersLoading(true);
      apiClient
        .get<{ data: FundingPartnerOption[] }>("/admin/funding-partners")
        .then((res) => setDrawerPartners((res.data.data ?? []).filter((p) => p.status === "active")))
        .catch(() => setDrawerError("Failed to load funding partners."))
        .finally(() => setDrawerPartnersLoading(false));
    }
  }, [viewTarget]);

  const handleDrawerAssign = async () => {
    if (!viewTarget || !drawerSelectedPartner) {
      setDrawerError("Please select a funding partner.");
      return;
    }
    const chosenPartner = drawerPartners.find((p) => p.id === drawerSelectedPartner);
    const contacts = chosenPartner?.contacts ?? [];
    if (contacts.length > 1 && !drawerSelectedContact) {
      setDrawerError("Please select a contact to notify.");
      return;
    }
    setDrawerError(null);
    setDrawerAssigning(true);
    try {
      await apiClient.post(`/admin/loans/${viewTarget.id}/assign-disbursement`, {
        fundingPartnerId: drawerSelectedPartner,
        ...(drawerSelectedContact ? { contactId: drawerSelectedContact } : {}),
      });
      setViewTarget(null);
      toastSuccess(
        viewTarget.assignedPartnerName
          ? "Funding partner reassigned successfully."
          : "Funding partner assigned successfully."
      );
      fetchKpis();
      fetchRows();
    } catch (err) {
      setDrawerError((err as { message?: string }).message ?? "Failed to assign partner.");
    } finally {
      setDrawerAssigning(false);
    }
  };

  const fetchKpis = useCallback(async () => {
    try {
      const [allRes, pendingRes, completedRes, rejectedRes] = await Promise.all([
        apiClient.get<{ data: { pagination: { total: number } } }>("/admin/disbursement-requests?status=all&limit=1"),
        apiClient.get<{ data: { pagination: { total: number } } }>("/admin/disbursement-requests?status=pending&limit=1"),
        apiClient.get<{ data: { pagination: { total: number } } }>("/admin/disbursement-requests?status=completed&limit=1"),
        apiClient.get<{ data: { pagination: { total: number } } }>("/admin/disbursement-requests?status=rejected&limit=1"),
      ]);
      setKpiCounts({
        all:       allRes.data.data.pagination.total,
        pending:   pendingRes.data.data.pagination.total,
        completed: completedRes.data.data.pagination.total,
        rejected:  rejectedRes.data.data.pagination.total,
      });
    } catch {
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{
        data: { applications: DisbursementRow[]; pagination: PageMeta };
      }>(`/admin/disbursement-requests?status=${tab}&page=${page}&limit=${limit}`);
      setRows(res.data.data.applications ?? []);
      setMeta(res.data.data.pagination);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load disbursement requests.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, limit]);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(1); }, [tab]);

  const filteredRows = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.referenceNumber.toLowerCase().includes(q) ||
      `${r.parent.firstName} ${r.parent.lastName}`.toLowerCase().includes(q)
    );
  });

  const tabCount = (key: TabKey) => {
    if (key === "all") return kpiCounts.all;
    if (key === "pending") return kpiCounts.pending;
    if (key === "completed") return kpiCounts.completed;
    if (key === "rejected") return kpiCounts.rejected;
    return 0;
  };

  const handleAssignSuccess = () => {
    setAssignTarget(null);
    toastSuccess("Funding partner assigned successfully.");
    fetchKpis();
    fetchRows();
  };

  const isPending = (row: DisbursementRow) =>
    row.status !== "disbursed" && row.status !== "rejected";

  return (
    <>
      {assignTarget && (
        <AssignPartnerModal
          app={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}

      <DrawerShell
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title="Disbursement Details"
        subtitle={viewTarget?.referenceNumber}
        footer={
          viewTarget && isPending(viewTarget) ? (
            <div className="flex gap-3">
              <button
                onClick={() => setViewTarget(null)}
                className="flex-1 rounded-xl border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDrawerAssign}
                disabled={drawerAssigning || drawerPartnersLoading || !drawerSelectedPartner}
                className="flex-1 rounded-xl text-white font-bold py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND }}
              >
                {drawerAssigning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assigning…
                  </>
                ) : (
                  viewTarget.assignedPartnerName ? "Reassign Partner" : "Assign Partner"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setViewTarget(null)}
              className="w-full rounded-xl border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          )
        }
      >
        {viewTarget && (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reference</p>
              <p className="font-semibold text-gray-900">{viewTarget.referenceNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(viewTarget.createdAt)}</p>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Parent</p>
              <p className="font-semibold text-gray-900">{viewTarget.parent.firstName} {viewTarget.parent.lastName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{viewTarget.parent.email}</p>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Student</p>
              <p className="font-semibold text-gray-900">{viewTarget.student.firstName} {viewTarget.student.lastName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Grade: {viewTarget.student.gradeLevel}</p>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">School & Bank</p>
              <p className="font-semibold text-gray-900">{viewTarget.school.name}</p>
              {viewTarget.bankDetails ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-gray-600">{viewTarget.bankDetails.bankName}</p>
                  <p className="text-xs text-gray-600">{viewTarget.bankDetails.accountName}</p>
                  <p className="text-xs text-gray-600 font-mono">{viewTarget.bankDetails.accountNumber}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No bank details on record.</p>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {formatAmount(viewTarget.amountApproved ?? viewTarget.amountRequested)}
              </p>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Disbursement Status</p>
              {viewTarget.status === "disbursed" || viewTarget.disbursement?.status === "successful" ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    Completed
                  </span>
                  {viewTarget.assignedPartnerName && (
                    <p className="text-xs text-gray-600 mt-1">
                      By: <span className="font-semibold">{viewTarget.assignedPartnerName}</span>
                    </p>
                  )}
                  {viewTarget.disbursement?.disbursedAt && (
                    <p className="text-xs text-gray-400">{fmtDate(viewTarget.disbursement.disbursedAt)}</p>
                  )}
                </div>
              ) : viewTarget.status === "rejected" ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
                    Rejected
                  </span>
                  {viewTarget.rejectionReason && (
                    <p className="text-xs text-gray-600 mt-1">Reason: {viewTarget.rejectionReason}</p>
                  )}
                  {viewTarget.disbursement?.failureReason && (
                    <p className="text-xs text-gray-500 mt-0.5">{viewTarget.disbursement.failureReason}</p>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  Awaiting Assignment
                </span>
              )}
            </div>

            {viewTarget && isPending(viewTarget) && (
              <>
                <div className="h-px bg-gray-100" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    {viewTarget.assignedPartnerName ? "Reassign To" : "Assign Funding Partner"}
                  </p>
                  {viewTarget.assignedPartnerName && (
                    <p className="text-xs text-gray-500 mb-2">
                      Currently assigned to <span className="font-semibold text-gray-700">{viewTarget.assignedPartnerName}</span>
                    </p>
                  )}
                  {drawerPartnersLoading ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                      <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
                      Loading partners…
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={drawerSelectedPartner}
                          onChange={(e) => {
                            setDrawerSelectedPartner(e.target.value);
                            setDrawerSelectedContact("");
                            setDrawerError(null);
                          }}
                          className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 bg-white"
                        >
                          <option value="">— Select funding partner —</option>
                          {drawerPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <ChevronDown />
                        </span>
                      </div>

                      {(() => {
                        const chosen = drawerPartners.find((p) => p.id === drawerSelectedPartner);
                        const contacts = chosen?.contacts ?? [];
                        if (!chosen || contacts.length === 0) return null;
                        if (contacts.length === 1) {
                          return (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                              <p className="text-xs font-semibold text-gray-500 mb-0.5">Notify</p>
                              <p className="text-sm font-semibold text-gray-800">{contacts[0].fullName}</p>
                              <p className="text-xs text-gray-500">{contacts[0].position ?? contacts[0].email}</p>
                              <p className="text-xs text-gray-400 font-mono">{contacts[0].email}</p>
                            </div>
                          );
                        }
                        return (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1.5">
                              Select Contact to Notify <span className="text-red-500">*</span>
                            </p>
                            <div className="relative">
                              <select
                                value={drawerSelectedContact}
                                onChange={(e) => { setDrawerSelectedContact(e.target.value); setDrawerError(null); }}
                                className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 bg-white"
                              >
                                <option value="">— Select contact —</option>
                                {contacts.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.fullName}{c.position ? ` — ${c.position}` : ""}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                <ChevronDown />
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {drawerError && (
                    <p className="mt-2 text-xs text-red-600 font-medium">{drawerError}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DrawerShell>

      <div className="max-w-[1280px] mx-auto py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disbursement Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Applications that have reached the disbursement stage — assign funding partners and track completion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Pending Disbursement", value: kpiCounts.pending,   color: "text-amber-600" },
            { label: "Completed",            value: kpiCounts.completed, color: "text-green-600" },
            { label: "Rejected",             value: kpiCounts.rejected,  color: "text-red-600"   },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</p>
              <p className={`text-2xl font-bold mt-2 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "pb-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap",
                tab === t.key
                  ? "border-[#7A0E42] text-[#7A0E42]"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {t.label}
              <span className={["text-xs font-bold", tab === t.key ? "text-[#7A0E42]" : "text-gray-400"].join(" ")}>
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference or parent…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          <div className="relative">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
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
                ) : filteredRows.length === 0 ? (
                  <EmptyRow cols={COLS.length} label="No disbursement requests found." />
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 whitespace-nowrap">{row.referenceNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {row.parent.firstName} {row.parent.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {row.student.firstName} {row.student.lastName}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 whitespace-nowrap">{row.school.name}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {formatAmount(row.amountApproved ?? row.amountRequested)}
                      </td>
                      <td className="px-5 py-4">
                        {row.bankDetails ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{row.bankDetails.bankName}</p>
                            <p className="text-xs text-gray-500 font-mono">{row.bankDetails.accountNumber}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <AppStatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4">
                        {row.assignedPartnerName ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{row.assignedPartnerName}</p>
                            <DisbStatusBadge row={row} />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewTarget(row)}
                            className="text-xs px-2 py-1 rounded-md font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredRows.length > 0 && (
            <Pagination
              meta={meta}
              page={page}
              totalPages={meta.pages}
              label="applications"
              onPage={setPage}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDisbursementRequestsPage;
