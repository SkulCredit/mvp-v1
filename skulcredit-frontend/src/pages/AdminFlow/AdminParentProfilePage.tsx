import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { BRAND, fmtDate, Ic } from "./components/shared";
import ParentFormModal, { ParentFormData } from "./components/ParentFormModal";
import { toastSuccess, toastError } from "../../utils/toast";

interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  relationship: string | null;
  employerType: string | null;
  monthlyIncome: string | null;
  nin: string | null;
  bvn: string | null;
  dob: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCountry: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin: string | null;
    createdAt: string;
  };
  students: Student[];
  loanApplications: LoanApp[];
  documents: Doc[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  gradeLevel: string | null;
  tuitionAmount: number | null;
  createdAt: string;
  school?: { id: string; name: string };
}

interface ApplicationEvent {
  id: string;
  actor: string;
  actorId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

interface LoanOffer {
  id: string;
  approvedAmount: number | null;
  interestRate: number | null;
  tenor: number | null;
  status: string;
  createdAt: string;
}

interface Disbursement {
  id: string;
  amount: number | null;
  status: string;
  disbursedAt: string | null;
  reference: string | null;
}

interface LoanLedger {
  id: string;
  status: string;
  outstandingBalance: number | null;
  totalRepaid: number | null;
}

interface LoanApp {
  id: string;
  referenceNumber: string | null;
  status: string;
  amount: number | null;
  tenor: number | null;
  createdAt: string;
  catalogSchool?: { id: string; name: string };
  student?: { id?: string; firstName: string; lastName: string; studentId?: string | null };
  amountRequested?: number | null;
  serviceChargeAmount?: number | null;
  serviceChargeRate?: number | null;
  academicSession?: string | null;
  termId?: string | null;
  rejectionReason?: string | null;
  adminNote?: string | null;
  decidedBy?: string | null;
  disbursedAt?: string | null;
  repaidAt?: string | null;
  updatedAt?: string;
  events?: ApplicationEvent[];
  offer?: LoanOffer | null;
  disbursement?: Disbursement | null;
  ledger?: LoanLedger | null;
}

interface Doc {
  id: string;
  type: string;
  url: string;
  createdAt: string;
}

const KYC_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  approved:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Verified"   },
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Pending"    },
  submitted: { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Submitted"  },
  rejected:  { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500",    label: "Rejected"   },
};

const LOAN_STATUS_CLS: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  approved:   "bg-green-50 text-green-700",
  rejected:   "bg-red-50 text-red-600",
  disbursed:  "bg-blue-50 text-blue-700",
  repaying:   "bg-purple-50 text-purple-700",
  completed:  "bg-gray-100 text-gray-600",
  cancelled:  "bg-gray-100 text-gray-500",
};

const loanStatusCls = (s: string) => LOAN_STATUS_CLS[s?.toLowerCase()] ?? "bg-gray-100 text-gray-500";

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `₦${n.toLocaleString("en-NG")}` : "—";

const actorDotColor = (actor: string): string => {
  switch (actor?.toLowerCase()) {
    case "admin":  return "#7A0E42";
    case "system": return "#9CA3AF";
    case "parent": return "#3B82F6";
    case "school": return "#A855F7";
    default:       return "#6B7280";
  }
};

const actorBadgeCls = (actor: string): string => {
  switch (actor?.toLowerCase()) {
    case "admin":  return "bg-[#7A0E42]/10 text-[#7A0E42]";
    case "system": return "bg-gray-100 text-gray-500";
    case "parent": return "bg-blue-50 text-blue-700";
    case "school": return "bg-purple-50 text-purple-700";
    default:       return "bg-gray-100 text-gray-500";
  }
};

const LoanApplicationDrawer: React.FC<{
  open: boolean;
  detail: LoanApp | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}> = ({ open, detail, loading, error, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const app = detail;

  const sortedEvents = app?.events
    ? [...app.events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="Loan application detail"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {app?.referenceNumber ?? (app ? app.id.slice(0, 8).toUpperCase() : "—")}
            </h2>
            {app && (
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${loanStatusCls(app.status)}`}>
                {app.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <Ic d="M18 6L6 18M6 6l12 12" cls="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[#7A0E42] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && app && (
            <>
              {/* Overview */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overview</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Amount Requested</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.amountRequested ?? app.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Service Charge Rate</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {app.serviceChargeRate != null ? `${app.serviceChargeRate}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Service Charge Amount</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.serviceChargeAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tenor</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {app.tenor != null ? `${app.tenor} months` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Academic Session</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{app.academicSession ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Created</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(app.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Student & School */}
              {app.student && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student & School</p>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: BRAND }}
                    >
                      {`${app.student.firstName?.[0] ?? ""}${app.student.lastName?.[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {app.student.firstName} {app.student.lastName}
                      </p>
                      {app.student.studentId && (
                        <p className="text-[11px] font-mono text-gray-400">{app.student.studentId}</p>
                      )}
                    </div>
                  </div>
                  {app.catalogSchool && (
                    <p className="text-sm text-gray-700">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">School</span>
                      {app.catalogSchool.name}
                    </p>
                  )}
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status Timeline</p>
                {sortedEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No events recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedEvents.map((evt, idx) => {
                      const dotColor = actorDotColor(evt.actor);
                      const badgeCls = actorBadgeCls(evt.actor);
                      return (
                        <div key={evt.id} className="relative pl-6">
                          {idx < sortedEvents.length - 1 && (
                            <div className="absolute left-2 top-5 bottom-0 w-px bg-gray-100" />
                          )}
                          <div
                            className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: dotColor }}
                          />
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${badgeCls}`}>
                              {evt.actor}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${loanStatusCls(evt.status)}`}>
                              {evt.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                          {evt.note && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-0.5">{evt.note}</p>
                          )}
                          <p className="text-[10px] text-gray-400">{fmtDate(evt.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Loan Offer */}
              {app.offer && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loan Offer</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Approved Amount</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.offer.approvedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Interest Rate</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {app.offer.interestRate != null ? `${app.offer.interestRate}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tenor</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {app.offer.tenor != null ? `${app.offer.tenor} months` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                      <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${loanStatusCls(app.offer.status)}`}>
                        {app.offer.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Created</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(app.offer.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Disbursement */}
              {app.disbursement && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Disbursement</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Amount</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.disbursement.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                      <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${loanStatusCls(app.disbursement.status)}`}>
                        {app.disbursement.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Disbursed Date</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {app.disbursement.disbursedAt ? fmtDate(app.disbursement.disbursedAt) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Reference</p>
                      <p className="text-sm font-mono text-gray-800 mt-0.5">{app.disbursement.reference ?? "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ledger */}
              {app.ledger && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ledger</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Outstanding Balance</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.ledger.outstandingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Repaid</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtMoney(app.ledger.totalRepaid)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                      <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${loanStatusCls(app.ledger.status)}`}>
                        {app.ledger.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection / Admin notes */}
              {(app.rejectionReason || app.adminNote) && (
                <div className="space-y-3">
                  {app.rejectionReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1.5">Rejection Reason</p>
                      <p className="text-sm text-red-700 leading-relaxed">{app.rejectionReason}</p>
                    </div>
                  )}
                  {app.adminNote && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5">Admin Note</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{app.adminNote}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

const KycBadge: React.FC<{ status: string; large?: boolean }> = ({ status, large }) => {
  const c = KYC_CONFIG[status] ?? KYC_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${c.bg} ${c.text} ${large ? "px-3.5 py-1.5 text-sm border-current/20" : "px-2.5 py-1 text-xs border-current/20"}`}>
      <span className={`rounded-full shrink-0 ${c.dot} ${large ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
      {c.label}
    </span>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value ?? <span className="text-gray-300">—</span>}</span>
  </div>
);

const Card: React.FC<{
  icon: string | string[];
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, children, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
             style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
          <Ic d={icon} cls="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

const Skeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3 py-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1">
        <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const DeleteModal: React.FC<{
  name: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ name, loading, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
       role="dialog" aria-modal="true"
       onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-6 h-6 text-red-500" />
        </div>
      </div>
      <h2 className="text-base font-bold text-gray-900">Delete Parent Account?</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-700">{name}</span> and all associated data will be permanently removed.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  </div>
);

const AdminParentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [parent,  setParent]  = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [editOpen,   setEditOpen]   = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [delOpen,    setDelOpen]    = useState(false);
  const [delLoading, setDelLoading] = useState(false);


  const [selectedApp,  setSelectedApp]  = useState<LoanApp | null>(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [drawerDetail, setDrawerDetail] = useState<LoanApp | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError,  setDrawerError]  = useState<string | null>(null);

  const fetchParent = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: ParentProfile }>(`/admin/parents/${id}`);
      setParent(res.data.data);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load parent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParent(); }, [id]);

  useEffect(() => {
    if (!selectedApp || !drawerOpen) return;
    let cancelled = false;
    setDrawerLoading(true);
    setDrawerError(null);
    setDrawerDetail(null);
    apiClient.get<{ data: LoanApp }>(`/admin/loans/${selectedApp.id}`)
      .then(res => { if (!cancelled) setDrawerDetail(res.data.data); })
      .catch(err => { if (!cancelled) setDrawerError((err as { message?: string }).message ?? "Failed to load application details"); })
      .finally(() => { if (!cancelled) setDrawerLoading(false); });
    return () => { cancelled = true; };
  }, [selectedApp, drawerOpen]);

  const handleEdit = async (data: ParentFormData) => {
    if (!parent) return;
    setEditSaving(true);
    try {
      if (data.kycStatus) {
        await apiClient.patch(`/admin/parents/${parent.id}/kyc`, { kycStatus: data.kycStatus });
      }
      await apiClient.patch(`/admin/parents/${parent.id}/eligibility-profile`, {
        phoneNumber:   data.phoneNumber  || undefined,
        employerType:  data.employerType || undefined,
        monthlyIncome: data.monthlyIncome || undefined,
      });
      toastSuccess("Parent updated.");
      setEditOpen(false);
      fetchParent();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Save failed.");
    } finally {
      setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!parent) return;
    setDelLoading(true);
    try {
      await apiClient.delete(`/admin/parents/${parent.id}`);
      toastSuccess("Parent deleted.");
      navigate("/admin/parents");
    } catch { toastError("Delete failed."); }
    finally { setDelLoading(false); }
  };

  const avatarInitials = (p: ParentProfile) => {
    return `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase();
  };

  const fullAddress = parent ? [
    parent.addressStreet,
    parent.addressCity,
    parent.addressState,
    parent.addressCountry,
  ].filter(Boolean).join(", ") : "";

  if (error) {
    return (
      <div className="max-w-[900px] mx-auto py-12 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[#7A0E42] hover:underline">← Back to Parents</button>
      </div>
    );
  }

  return (
    <>
      {/* Loan Application Drawer */}
      <LoanApplicationDrawer
        open={drawerOpen}
        detail={drawerDetail}
        loading={drawerLoading}
        error={drawerError}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedApp(null);
          setDrawerDetail(null);
          setDrawerError(null);
        }}
      />

      {parent && (
        <ParentFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={{
            firstName:    parent.firstName,
            lastName:     parent.lastName,
            email:        parent.user?.email ?? "",
            phoneNumber:  parent.user?.phoneNumber ?? "",
            kycStatus:    parent.kycStatus,
            relationship: parent.relationship ?? "",
            employerType: parent.employerType ?? "",
            monthlyIncome: parent.monthlyIncome ?? "",
          }}
          onSave={handleEdit}
          saving={editSaving}
        />
      )}

      {delOpen && parent && (
        <DeleteModal
          name={`${parent.firstName} ${parent.lastName}`}
          loading={delLoading}
          onConfirm={handleDelete}
          onCancel={() => setDelOpen(false)}
        />
      )}

      <div className="max-w-[1000px] mx-auto py-6 sm:py-8 space-y-6">

        <button
          onClick={() => navigate("/admin/parents")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#7A0E42] transition-colors"
        >
          <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />
          Back to Parents
        </button>

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24 sm:h-28 w-full" style={{ backgroundColor: BRAND }} />
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12">
              <div className="flex items-end gap-4">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold shrink-0"
                  style={{ backgroundColor: "#5e0a31" }}
                >
                  {loading ? "…" : avatarInitials(parent ?? { firstName: "P", lastName: "A" } as ParentProfile)}
                </div>
                {!loading && parent && (
                  <div className="pb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                      {parent.firstName} {parent.lastName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <KycBadge status={parent.kycStatus} large />
                      {parent.relationship && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                          {parent.relationship}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Registered {fmtDate(parent.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!loading && parent && (
                <div className="flex flex-wrap items-center gap-2 pb-1 mt-4 sm:mt-0">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cls="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDelOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Ic d={["M3 6h18","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {!loading && parent && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                {[
                  { label: "Email",        value: parent.user?.email ?? "—" },
                  { label: "Phone",        value: parent.user?.phoneNumber ?? "—" },
                  { label: "Students",     value: String(parent.students?.length ?? 0) },
                  { label: "Applications", value: String(parent.loanApplications?.length ?? 0) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Personal Details */}
          <Card icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" title="Personal Details">
            {loading ? <Skeleton /> : parent ? (
              <>
                <InfoRow label="First Name"           value={parent.firstName} />
                <InfoRow label="Last Name"            value={parent.lastName} />
                <InfoRow label="Relationship"         value={parent.relationship} />
                <InfoRow label="Date of Birth"        value={parent.dob ? fmtDate(parent.dob) : null} />
                <InfoRow label="Full Address"         value={fullAddress || null} />
                <InfoRow label="City"                 value={parent.addressCity} />
                <InfoRow label="State"                value={parent.addressState} />
                <InfoRow label="Country"              value={parent.addressCountry ?? "Nigeria"} />
                <InfoRow label="Registered On"        value={fmtDate(parent.createdAt)} />
                <InfoRow label="Last Updated"         value={fmtDate(parent.updatedAt)} />
              </>
            ) : null}
          </Card>

          {/* Account & Contact */}
          <Card
            icon="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.22 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.64 16z"
            title="Account & Contact"
          >
            {loading ? <Skeleton /> : parent ? (
              <>
                <InfoRow label="Email Address" value={
                  <a href={`mailto:${parent.user?.email}`} className="text-[#7A0E42] hover:underline">
                    {parent.user?.email}
                  </a>
                } />
                <InfoRow label="Phone Number"   value={parent.user?.phoneNumber} />
                <InfoRow label="Account Status" value={
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${parent.user?.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${parent.user?.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {parent.user?.isActive ? "Active" : "Suspended"}
                  </span>
                } />
                <InfoRow label="Email Verified" value={
                  <span className={`text-xs font-semibold ${parent.user?.isEmailVerified ? "text-green-600" : "text-amber-600"}`}>
                    {parent.user?.isEmailVerified ? "✓ Verified" : "✗ Not Verified"}
                  </span>
                } />
                <InfoRow label="Last Login"      value={parent.user?.lastLogin ? fmtDate(parent.user.lastLogin) : "Never"} />
                <InfoRow label="Account Created" value={parent.user?.createdAt ? fmtDate(parent.user.createdAt) : "—"} />
              </>
            ) : null}
          </Card>

          {/* KYC & Employment */}
          <Card
            icon={["M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"]}
            title="KYC & Employment"
          >
            {loading ? <Skeleton rows={5} /> : parent ? (
              <>
                <InfoRow label="KYC Status" value={<KycBadge status={parent.kycStatus} />} />
                <InfoRow label="NIN" value={
                  parent.nin
                    ? <span className="font-mono tracking-widest">{parent.nin}</span>
                    : null
                } />
                <InfoRow label="BVN" value={
                  parent.bvn
                    ? <span className="font-mono tracking-widest">{parent.bvn.replace(/\d(?=\d{4})/g, "*")}</span>
                    : null
                } />
                <InfoRow label="Employer Type"  value={parent.employerType} />
                <InfoRow label="Monthly Income" value={parent.monthlyIncome} />
              </>
            ) : null}
          </Card>

          {/* Documents */}
          <Card
            icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"
            title="Documents"
          >
            {loading ? <Skeleton rows={3} /> : parent ? (
              parent.documents?.length ? (
                parent.documents.map(doc => (
                  <InfoRow
                    key={doc.id}
                    label={doc.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    value={
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-[#7A0E42] hover:underline text-sm">
                        <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" cls="w-3.5 h-3.5" />
                        View Document
                      </a>
                    }
                  />
                ))
              ) : (
                <div className="py-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" cls="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                </div>
              )
            ) : null}
          </Card>
        </div>

        {/* ── Students ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                   style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                <Ic d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0 1 12 21a12.083 12.083 0 0 1-6.16-10.422L12 14z" cls="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Students</h3>
            </div>
            <span className="text-xs text-gray-400">{parent?.students?.length ?? 0} total</span>
          </div>

          {loading ? (
            <div className="px-5 py-4 space-y-3">
              {[1,2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : !parent?.students?.length ? (
            <div className="py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                <Ic d="M12 14l9-5-9-5-9 5 9 5z" cls="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No students registered under this parent.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {["STUDENT", "SCHOOL", "GRADE LEVEL", "TUITION AMOUNT", "DATE ADDED"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parent.students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                               style={{ backgroundColor: BRAND }}>
                            {`${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                            {s.studentId && (
                              <p className="text-[11px] text-gray-400 font-mono">{s.studentId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {s.school?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {s.gradeLevel ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                        {s.tuitionAmount != null
                          ? `₦${s.tuitionAmount.toLocaleString("en-NG")}`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Loan Applications ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                   style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8" cls="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Loan Applications</h3>
            </div>
            <span className="text-xs text-gray-400">{parent?.loanApplications?.length ?? 0} total</span>
          </div>

          {loading ? (
            <div className="px-5 py-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="ml-auto h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : !parent?.loanApplications?.length ? (
            <div className="py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                <Ic d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" cls="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No loan applications yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {["REFERENCE", "STUDENT", "SCHOOL", "AMOUNT", "TENOR", "STATUS", "DATE", "ACTIONS"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parent.loanApplications.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold" style={{ color: BRAND }}>
                          {app.referenceNumber ?? app.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {app.student
                          ? `${app.student.firstName} ${app.student.lastName}`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {app.catalogSchool?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                        {app.amount != null
                          ? `₦${app.amount.toLocaleString("en-NG")}`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                        {app.tenor != null ? `${app.tenor} months` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${loanStatusCls(app.status)}`}>
                          {app.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(app.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => { setSelectedApp(app); setDrawerOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default AdminParentProfilePage;
