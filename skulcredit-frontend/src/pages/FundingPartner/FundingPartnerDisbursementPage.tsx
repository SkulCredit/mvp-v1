import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";
import { paymentService, AletpayInitResult } from "../../services/paymentService";

interface ApplicationDetail {
  id: string;
  referenceNumber: string | null;
  status: string;
  disbursementStatus: string;
  amountRequested: number;
  amountApproved: number | null;
  tenor: number;
  serviceChargeAmount: number | null;
  serviceChargeRate: number | null;
  serviceFeePaid: boolean;
  createdAt: string;
  student?: {
    firstName?: string;
    lastName?: string;
    studentId?: string | null;
    gradeLevel?: string;
  };
  parent?: {
    firstName?: string;
    lastName?: string;
  };
  catalogSchool?: {
    id?: string;
    name?: string;
    tier?: string | null;
    bankAccounts?: BankAccount[];
  };
  school?: {
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
  };
  schedule?: {
    installmentNumber: number;
    dueDate: string;
    totalAmount: number;
    outstandingBalance: number;
    status: string;
  }[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  isVerified: boolean;
}

const fmt = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function resolveBank(detail: ApplicationDetail) {
  const primary =
    detail.catalogSchool?.bankAccounts?.find((b) => b.isPrimary) ??
    detail.catalogSchool?.bankAccounts?.[0];
  return {
    bankName: primary?.bankName ?? detail.school?.bankName ?? "Not provided",
    accountNumber: primary?.accountNumber ?? detail.school?.bankAccountNumber ?? "Not provided",
    accountName: primary?.accountName ?? detail.school?.bankAccountName ?? "Not provided",
    isVerified: primary?.isVerified ?? false,
  };
}

// ── Reusable detail row ────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value: React.ReactNode; bold?: boolean; large?: boolean }> = ({
  label,
  value,
  bold = false,
  large = false,
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 shrink-0 min-w-[140px]">{label}</span>
    <span
      className={`text-right break-all ${large ? "text-xl font-extrabold text-brand" : bold ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-800"}`}
    >
      {value}
    </span>
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, badge, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {badge}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="px-6 py-1">{children}</div>
  </div>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBank = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <path d="M3 22V9M21 22V9M12 22V9M1 9h22M12 3 1 9h22L12 3z" />
  </svg>
);
const IconCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconRef = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconMoney = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v3M10 14h4" />
  </svg>
);
const IconPurpose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// ── Terminal states ────────────────────────────────────────────────────────────
const TerminalCard: React.FC<{ success: boolean; title: string; body: React.ReactNode }> = ({ success, title, body }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <nav className="bg-brand px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
          <img src="/logo_white.png" alt="SkulCredit" className="h-8 w-auto" />
      </div>
    </nav>
    <div className="flex-1 flex items-center justify-center px-4">
      <div className={`bg-white rounded-3xl shadow-md border px-8 py-10 text-center max-w-sm w-full ${success ? "border-green-100" : "border-red-100"}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${success ? "bg-green-50" : "bg-red-50"}`}>
          {success
            ? <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          }
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">{title}</h2>
        <div className="text-sm text-gray-500 leading-relaxed">{body}</div>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const FundingPartnerDisbursementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  type ActionState = "idle" | "submitting" | "done_disbursed" | "done_rejected" | "error";
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferRefError, setTransferRefError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  // Aletpay virtual account
  const [disbursementVA, setDisbursementVA] = useState<AletpayInitResult | null>(null);
  const [isLoadingVA, setIsLoadingVA] = useState(false);
  const [vaError, setVaError] = useState("");
  const [vaCopiedField, setVaCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/schools/disbursement/${id}`)
      .then((res) => setDetail(res.data.data as ApplicationDetail))
      .catch(() => setLoadError("Failed to load funding request. The link may be expired or invalid."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDisbursed = async () => {
    if (!transferRef.trim()) {
      setTransferRefError("Please enter your bank transfer reference before confirming.");
      return;
    }
    if (!id) return;
    setTransferRefError("");
    setActionState("submitting");
    setActionError("");
    try {
      await apiClient.post(`/schools/applications/${id}/disbursement-callback`, {
        action: "disbursed",
        note: `Disbursement confirmed by funding partner. Transfer reference: ${transferRef.trim()}`,
      });
      setActionState("done_disbursed");
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(axErr.response?.data?.message ?? "Disbursement confirmation failed. Please try again.");
      setActionState("error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) { setRejectReasonError("Please provide a reason for rejection."); return; }
    if (!id) return;
    setRejectReasonError("");
    setShowRejectModal(false);
    setActionState("submitting");
    setActionError("");
    try {
      await apiClient.post(`/schools/applications/${id}/disbursement-callback`, {
        action: "rejected",
        note: rejectReason.trim(),
      });
      setActionState("done_rejected");
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(axErr.response?.data?.message ?? "Failed to record rejection. Please try again.");
      setActionState("error");
    }
  };

  const handleGenerateDisbursementVA = async () => {
    if (!detail || !id) return;
    setIsLoadingVA(true);
    setVaError("");
    try {
      const result = await paymentService.generateDisbursementVirtualAccount({
        applicationId: id,
        amount: Number(detail.amountApproved ?? detail.amountRequested),
        schoolName: detail.catalogSchool?.name,
        bankAccountNumber: resolveBank(detail).accountNumber,
      });
      setDisbursementVA(result);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setVaError(axErr.response?.data?.message ?? "Failed to generate payment account. Please try again.");
    } finally {
      setIsLoadingVA(false);
    }
  };

  const handleVaCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setVaCopiedField(field);
      setTimeout(() => setVaCopiedField(null), 1500);
    } catch { setVaCopiedField(null); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <TerminalCard
        success={false}
        title="Link Invalid or Expired"
        body={<p>{loadError}</p>}
      />
    );
  }

  if (!detail) return null;

  const bank = resolveBank(detail);
  const amountToDisburse = Number(detail.amountApproved ?? detail.amountRequested);
  const alreadyProcessed =
    detail.disbursementStatus === "successful" ||
    detail.disbursementStatus === "failed" ||
    actionState === "done_disbursed" ||
    actionState === "done_rejected";

  // ── Terminal states ────────────────────────────────────────────────────────
  if (actionState === "done_disbursed") {
    return (
      <TerminalCard
        success={true}
        title="Disbursement Confirmed"
        body={
          <p>
            We've recorded the disbursement of <strong>{fmt(amountToDisburse)}</strong> for
            application <strong>{detail.referenceNumber ?? detail.id}</strong>. The parent has been notified.
          </p>
        }
      />
    );
  }

  if (actionState === "done_rejected") {
    return (
      <TerminalCard
        success={false}
        title="Disbursement Rejected"
        body={<p>The rejection has been recorded. The SkulCredit operations team and the parent have been notified.</p>}
      />
    );
  }

  if (detail.disbursementStatus === "successful") {
    return (
      <TerminalCard
        success={true}
        title="Already Confirmed"
        body={<p>This disbursement has already been confirmed.<br /><span className="text-xs text-gray-400">Ref: {detail.referenceNumber ?? detail.id}</span></p>}
      />
    );
  }

  if (detail.disbursementStatus === "failed") {
    return (
      <TerminalCard
        success={false}
        title="Already Rejected"
        body={<p>This disbursement has already been rejected.<br /><span className="text-xs text-gray-400">Ref: {detail.referenceNumber ?? detail.id}</span></p>}
      />
    );
  }

  const initials = `${detail.parent?.firstName?.[0] ?? "F"}${detail.parent?.lastName?.[0] ?? "P"}`.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 id="reject-modal-title" className="text-lg font-bold text-gray-900 mb-2">Reject Disbursement</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a clear reason. This will be recorded and the parent will be notified.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); if (rejectReasonError) setRejectReasonError(""); }}
              placeholder="e.g. School bank account details could not be verified…"
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-colors"
            />
            {rejectReasonError && <p className="mt-1 text-xs text-red-600 font-medium">{rejectReasonError}</p>}
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowRejectModal(false)} className="flex-1 rounded-full border-2 border-gray-200 text-gray-600 font-bold py-2.5 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="button" onClick={handleRejectSubmit} className="flex-1 rounded-full bg-red-600 text-white font-bold py-2.5 text-sm hover:bg-red-700 transition-colors shadow-sm">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top navbar ── */}
      <nav className="bg-brand px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo_white.png" alt="SkulCredit" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-white/80 text-xs font-semibold">
            <IconShield />
            <span>Funding Partner Portal</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      </nav>

      {/* ── Page body ── */}
      <main className="flex-1 py-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">Disbursement Request</p>
              <h1 className="text-3xl font-extrabold text-gray-900">Disbursement Details</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Review the recipient's information and payment details below. Confirm to proceed with the disbursement.
              </p>
            </div>
            <span className="flex-shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Pending Confirmation
            </span>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column (2/3) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Recipient Information */}
              <SectionCard
                icon={<IconPerson />}
                title="Recipient Information"
                subtitle="Student and parent details for this disbursement request."
              >
                <Row label="Parent Name" value={`${detail.parent?.firstName ?? "—"} ${detail.parent?.lastName ?? ""}`.trim()} bold />
                <Row label="Student Name" value={`${detail.student?.firstName ?? "—"} ${detail.student?.lastName ?? ""}`.trim()} bold />
                <Row label="Admission No." value={detail.student?.studentId ?? "N/A"} bold />
                <Row label="Grade / Level" value={detail.student?.gradeLevel ?? "N/A"} bold />
                <Row label="School" value={detail.catalogSchool?.name ?? "N/A"} bold />
                <Row label="School Tier" value={detail.catalogSchool?.tier ? `Tier ${detail.catalogSchool.tier}` : "N/A"} bold />
                <Row label="Repayment Plan" value={`${detail.tenor}-month plan`} bold />
                <Row
                  label="Service Charge Paid"
                  value={
                    detail.serviceFeePaid
                      ? detail.serviceChargeAmount ? fmt(detail.serviceChargeAmount) : "Paid"
                      : "Not paid"
                  }
                  bold
                />
                <Row label="Amount to Disburse" value={fmt(amountToDisburse)} large />
              </SectionCard>

              {/* School Bank Account */}
              <SectionCard
                icon={<IconBank />}
                title="School Bank Account"
                subtitle="Account where the funds will be sent."
                badge={
                  bank.isVerified ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <IconCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : undefined
                }
              >
                <Row label="Bank Name" value={bank.bankName} bold />
                <Row label="Account Number" value={bank.accountNumber} bold />
                <Row label="Account Name" value={bank.accountName} bold />
              </SectionCard>

              {/* Payment Details */}
              <SectionCard
                icon={<IconCard />}
                title="Payment Details"
                subtitle="This is the amount to be transferred to the school's account."
              >
                <div className="py-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <IconMoney />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Amount</p>
                        <p className="text-xl font-extrabold text-brand">{fmt(amountToDisburse)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <IconPurpose />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Purpose</p>
                        <p className="text-sm font-bold text-gray-900">School Fees / Service Charge</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Reference / Transfer Section */}
              {/* {!alreadyProcessed && (
                <SectionCard
                  icon={<IconRef />}
                  title="Transfer Reference"
                  subtitle="Enter your bank transfer reference to confirm the disbursement."
                >
                  <div className="py-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Need a virtual account?{" "}
                        <span className="text-gray-400 font-normal">Generate one via Aletpay / Wema Bank.</span>
                      </p>
                      {!disbursementVA ? (
                        <button
                          type="button"
                          onClick={handleGenerateDisbursementVA}
                          disabled={isLoadingVA}
                          className="flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover border border-brand/20 bg-brand-50 hover:bg-brand-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {isLoadingVA
                            ? <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            : <IconBank />}
                          {isLoadingVA ? "Generating…" : "Generate Virtual Account"}
                        </button>
                      ) : (
                        <div className="bg-brand-50 border border-brand/10 rounded-xl p-4 space-y-2">
                          {[
                            { field: "vaBank", label: "Bank Name", value: disbursementVA.bankName },
                            { field: "vaAcct", label: "Account Number", value: disbursementVA.virtualBankAccountNumber },
                            { field: "vaAmt",  label: "Amount", value: fmt(amountToDisburse) },
                          ].map((row) => (
                            <div key={row.field} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-brand/10">
                              <div>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase">{row.label}</p>
                                <p className="text-sm font-bold text-gray-900">{row.value}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleVaCopy(row.field, row.value)}
                                className="text-xs font-bold text-brand px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-50 transition-colors border border-brand/10"
                              >
                                {vaCopiedField === row.field ? "Copied ✓" : "Copy"}
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[11px] text-gray-400">Valid for 24 hours.</p>
                            <button
                              type="button"
                              onClick={handleGenerateDisbursementVA}
                              disabled={isLoadingVA}
                              className="text-xs text-brand hover:text-brand-hover font-medium transition-colors disabled:opacity-50"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>
                      )}
                      {vaError && <p className="mt-2 text-xs text-red-600 font-medium">{vaError}</p>}
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Bank Transfer Reference <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={transferRef}
                        onChange={(e) => { setTransferRef(e.target.value); if (transferRefError) setTransferRefError(""); }}
                        placeholder="e.g. NIP/240901/0012345678"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-colors"
                      />
                      {transferRefError && <p className="mt-1 text-xs text-red-600 font-medium">{transferRefError}</p>}
                      <p className="mt-1 text-xs text-gray-400">This reference will be recorded for audit purposes.</p>
                    </div>

                    {actionState === "error" && actionError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                        {actionError}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )} */}

              {/* Repayment schedule */}
              {(detail.schedule?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">Parent Repayment Schedule</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-2.5 text-left text-xs text-gray-400 font-semibold uppercase">#</th>
                        <th className="px-6 py-2.5 text-left text-xs text-gray-400 font-semibold uppercase">Due Date</th>
                        <th className="px-6 py-2.5 text-right text-xs text-gray-400 font-semibold uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.schedule ?? []).map((s) => (
                        <tr key={s.installmentNumber} className="border-t border-gray-50">
                          <td className="px-6 py-3 font-semibold text-gray-700">#{s.installmentNumber}</td>
                          <td className="px-6 py-3 text-gray-600">
                            {new Date(s.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-brand">{fmt(s.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Right column (1/3) ── */}
            <div className="space-y-6">
              {!alreadyProcessed ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 sticky top-6">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <IconShield />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Ready to Confirm?</h3>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Once you confirm, the payment will be processed and sent to the school's account details provided.
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2.5">
                    {[
                      "Verify the account number and bank name are correct",
                      "Ensure the amount matches the requested disbursement",
                      "Confirm the recipient details",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconCheck className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center gap-2 text-xs text-gray-400">
                    <IconLock />
                    <span>Your confirmation is secure and will be processed immediately.</span>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={handleDisbursed}
                      disabled={actionState === "submitting"}
      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                    >
                      {actionState === "submitting"
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <IconCheck className="w-4 h-4" />}
                      Confirm Disbursement
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionState === "submitting"}
                      className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <IconX className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    Once confirmed, this action cannot be undone. The parent will be notified immediately.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-sm font-semibold text-gray-500">This disbursement has been processed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-4 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <img src="/logo_nav.png" alt="SkulCredit" className="h-5 w-auto opacity-60" />
          <span>·</span>
          <span>Secure</span>
          <span>·</span>
          <span>Reliable</span>
          <span>·</span>
          <span>Education for a Brighter Future</span>
        </div>
      </footer>
    </div>
  );
};

export default FundingPartnerDisbursementPage;
