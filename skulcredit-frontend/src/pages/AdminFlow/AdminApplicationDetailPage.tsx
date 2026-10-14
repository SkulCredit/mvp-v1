import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import { BRAND, fmtDate } from "./components/shared";

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

interface ApplicationEvent {
  id: string;
  loanApplicationId: string;
  actor: string;
  actorId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

interface LoanApplicationDetail {
  id: string;
  referenceNumber: string;
  status: LoanApplicationStatus;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number | null;
  serviceChargeAmount: number | null;
  adminNote: string | null;
  rejectionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  student: { id: string; firstName: string; lastName: string; gradeLevel: string | null };
  catalogSchool: { id: string; name: string };
  parent: { id: string; firstName: string; lastName: string; user: { email: string; phoneNumber: string | null } };
  events: ApplicationEvent[];
}

// ─── Status maps ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LoanApplicationStatus, string> = {
  pending:             "border border-amber-300 text-amber-700 bg-amber-50",
  under_review:        "border border-blue-300 text-blue-700 bg-blue-50",
  info_requested:      "border border-orange-300 text-orange-700 bg-orange-50",
  school_verification: "border border-purple-300 text-purple-700 bg-purple-50",
  approved:            "border border-green-300 text-green-700 bg-green-50",
  rejected:            "border border-red-300 text-red-600 bg-red-50",
  disbursed:           "border border-indigo-300 text-indigo-700 bg-indigo-50",
  repaid:              "border border-teal-300 text-teal-700 bg-teal-50",
  cancelled:           "border border-gray-300 text-gray-500 bg-gray-50",
};

const STATUS_LABEL: Record<LoanApplicationStatus, string> = {
  pending:             "Pending",
  under_review:        "Under Review",
  info_requested:      "Info Requested",
  school_verification: "School Verification",
  approved:            "Approved",
  rejected:            "Rejected",
  disbursed:           "Disbursed",
  repaid:              "Repaid",
  cancelled:           "Cancelled",
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number | null | undefined): string =>
  n != null ? `₦${n.toLocaleString("en-NG")}` : "—";

const fmtDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

// Only these statuses allow admin cancellation
const CANCELLABLE: LoanApplicationStatus[] = ["pending", "under_review", "school_verification"];

// Format any status string: underscores → spaces, title-case
function fmtStatus(status: string): string {
  const known = STATUS_LABEL[status as LoanApplicationStatus];
  if (known) return known;
  return status
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Timeline dot colour logic:
// - rejected / cancelled → red
// - everything else → green (the event happened, so it's a positive step)
function dotColor(status: string): string {
  if (status === "rejected" || status === "cancelled") return "bg-red-500";
  return "bg-green-500";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-medium text-gray-500 shrink-0 w-36">{label}</span>
    <span className="text-sm text-gray-900 text-right">{value}</span>
  </div>
);

const StatusBadge: React.FC<{ status: LoanApplicationStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    STATUS_BADGE[status] ?? "border border-gray-200 text-gray-500"
  }`}>
    {STATUS_LABEL[status] ?? status}
  </span>
);

// ─── Page component ───────────────────────────────────────────────────────────

const AdminApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app,           setApp]           = useState<LoanApplicationDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [cancelTarget,  setCancelTarget]  = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchApp = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: LoanApplicationDetail }>(`/admin/loans/${id}`);
      setApp(res.data.data);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const canCancel = app && CANCELLABLE.includes(app.status);

  const handleCancel = async () => {
    if (!id) return;
    setCancelLoading(true);
    try {
      await apiClient.patch(`/admin/loans/${id}/status`, { status: "cancelled" });
      toastSuccess("Application cancelled.");
      setCancelTarget(false);
      fetchApp();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Cancel failed.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

      {/* ── Cancel confirmation modal ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setCancelTarget(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                     strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-900">Cancel Application?</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              This application will be set to cancelled. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCancelTarget(false)}
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

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex justify-center items-center py-32">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: BRAND, borderTopColor: "transparent" }}
          />
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-32 text-sm text-red-500">
          <p>{error}</p>
          <button
            onClick={fetchApp}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      {!loading && !error && app && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Back arrow */}
            <button
              onClick={() => navigate("/admin/applications")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Back to applications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
              <button
                onClick={() => navigate("/admin/applications")}
                className="hover:underline hover:text-gray-700 transition-colors"
              >
                Applications
              </button>
              <span>/</span>
              <span className="font-semibold" style={{ color: BRAND }}>{app.referenceNumber}</span>
            </nav>

            {/* Cancel button */}
            {canCancel && (
              <button
                onClick={() => setCancelTarget(true)}
                className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: BRAND }}
              >
                Cancel Application
              </button>
            )}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* Left column */}
            <div className="space-y-6">

              {/* Card: Application Overview */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-900">Application Overview</h2>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-bold" style={{ color: BRAND }}>{app.referenceNumber}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <InfoRow label="Amount Requested" value={fmtMoney(app.amountRequested)} />
                  <InfoRow label="Amount Approved"  value={fmtMoney(app.amountApproved)} />
                  <InfoRow label="Tenor"            value={app.tenor ? `${app.tenor} months` : "—"} />
                  <InfoRow label="Service Charge"   value={fmtMoney(app.serviceChargeAmount)} />
                  <InfoRow label="Submitted"        value={fmtDate(app.createdAt)} />
                  <InfoRow label="Decided"          value={app.decidedAt ? fmtDate(app.decidedAt) : "—"} />
                  <InfoRow label="Terms Accepted"   value={app.termsAccepted ? "Yes" : "No"} />

                  {app.adminNote && (
                    <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600 italic">
                      {app.adminNote}
                    </div>
                  )}

                  {app.status === "rejected" && app.rejectionReason && (
                    <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      <p className="text-xs font-bold uppercase tracking-wide mb-1">Rejection Reason</p>
                      {app.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Applicant */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-900">Applicant</h2>
                </div>
                <div className="px-5 py-4">
                  <InfoRow label="Parent"  value={`${app.parent.firstName} ${app.parent.lastName}`} />
                  <InfoRow label="Email"   value={app.parent.user.email} />
                  <InfoRow label="Phone"   value={app.parent.user.phoneNumber ?? "—"} />
                  <InfoRow label="Student" value={`${app.student.firstName} ${app.student.lastName}`} />
                  <InfoRow label="Grade"   value={app.student.gradeLevel ?? "—"} />
                  <InfoRow label="School"  value={app.catalogSchool.name} />
                </div>
              </div>
            </div>

            {/* Right column: Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden self-start">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Status Timeline</h2>
                <p className="text-xs text-gray-400 mt-0.5">History of status changes and notes</p>
              </div>

              {app.events.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  No timeline events yet.
                </div>
              ) : (
                <ol className="px-5 py-4">
                  {app.events.map((ev, idx) => {
                    const isLast = idx === app.events.length - 1;
                    return (
                      <li key={ev.id} className="relative flex gap-4">
                        {/* Spine: dot + connecting line */}
                        <div className="flex flex-col items-center shrink-0 w-5">
                          {/* Dot */}
                          <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 z-10 ${dotColor(ev.status)}`} />
                          {/* Line to next */}
                          {!isLast && (
                            <div className="w-0.5 flex-1 my-1 bg-green-200" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                          {/* Status label + actor badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 leading-tight">
                              {fmtStatus(ev.status)}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              ev.actor === "admin"  ? "bg-rose-50 text-rose-600" :
                              ev.actor === "school" ? "bg-purple-50 text-purple-600" :
                              ev.actor === "parent" ? "bg-blue-50 text-blue-600" :
                                                      "bg-gray-100 text-gray-500"
                            }`}>
                              {ev.actor}
                            </span>
                          </div>

                          {/* Note */}
                          {ev.note && (
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed italic">
                              {ev.note}
                            </p>
                          )}

                          {/* Timestamp */}
                          <p className="mt-1 text-[11px] text-gray-400">
                            {fmtDateTime(ev.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminApplicationDetailPage;
