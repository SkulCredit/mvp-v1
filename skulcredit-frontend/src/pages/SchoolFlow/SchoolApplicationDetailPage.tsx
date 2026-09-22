import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import { AxiosError } from "axios";

interface ApplicationDetail {
  id: string;
  referenceNumber?: string | null;
  status: string;
  amountRequested?: number | string;
  amountApproved?: number | string | null;
  tenor?: number;
  serviceChargeRate?: number | string | null;
  serviceChargeAmount?: number | string | null;
  serviceFeePaid?: boolean;
  disbursementStatus?: string;
  schoolVerificationStatus?: string;
  rejectionReason?: string | null;
  adminNote?: string | null;
  termsAccepted?: boolean;
  termsAcceptedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    studentId?: string | null;
    tuitionAmount?: number | string;
    parent?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      user?: { email?: string; phoneNumber?: string | null };
    };
  };
  catalogSchool?: {
    id?: string;
    name?: string;
    tier?: string | null;
    serviceChargeRate?: number | string | null;
    isRegistered?: boolean;
  };
  school?: {
    id?: string;
    schoolName?: string;
    contactPerson?: string;
    addressStreet?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
  };
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending:             { label: "Pending Verification", bg: "bg-amber-50",   text: "text-amber-700" },
  school_verification: { label: "Pending Verification", bg: "bg-amber-50",   text: "text-amber-700" },
  under_review:        { label: "Accepted",             bg: "bg-blue-50",    text: "text-blue-700" },
  approved:            { label: "Approved",             bg: "bg-green-50",   text: "text-green-700" },
  disbursed:           { label: "Disbursed",            bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected:            { label: "Rejected",             bg: "bg-red-50",     text: "text-red-700" },
  cancelled:           { label: "Cancelled",            bg: "bg-slate-100",  text: "text-slate-600" },
};

const statusStyle = (s: string) =>
  STATUS_STYLES[s] ?? { label: s.replace(/_/g, " "), bg: "bg-slate-100", text: "text-slate-600" };

const fmt = (n?: number | string | null) =>
  n != null && n !== "" ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const isPending = (s: string) =>
  ["pending", "school_verification", "pending_school_approval"].includes(s);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500 shrink-0 w-44">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right break-words flex-1">{value ?? "—"}</span>
  </div>
);

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
        <Icon name={icon} className="w-4 h-4 text-brand" />
      </div>
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="px-6 py-1">{children}</div>
  </div>
);

const SchoolApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionDone, setActionDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    schoolService
      .getApplication(id)
      .then((data) => setDetail(data as ApplicationDetail))
      .catch(() => setLoadError("Failed to load application. Please go back and try again."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    setActionError("");
    setActioning(true);
    try {
      await schoolService.verifyEnrollment(id, { action: "confirm" });
      const refreshed = await schoolService.getApplication(id);
      setDetail(refreshed as ApplicationDetail);
      setActionDone(true);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setActionError(ax.response?.data?.message ?? (err as Error).message ?? "Action failed.");
    } finally {
      setActioning(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }
    if (!id) return;
    setRejectError("");
    setShowRejectModal(false);
    setActionError("");
    setActioning(true);
    try {
      await schoolService.verifyEnrollment(id, { action: "reject", note: rejectReason.trim() });
      const refreshed = await schoolService.getApplication(id);
      setDetail(refreshed as ApplicationDetail);
      setActionDone(true);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setActionError(ax.response?.data?.message ?? (err as Error).message ?? "Action failed.");
    } finally {
      setActioning(false);
    }
  };

  const canAct = detail ? isPending(detail.status) : false;
  const { label: statusLabel, bg: statusBg, text: statusText } = detail
    ? statusStyle(detail.status)
    : { label: "", bg: "", text: "" };

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
      <div className="pt-8 pb-16 w-[90%] mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/school/applications")}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand transition-colors group"
            aria-label="Back"
          >
            <Icon
              name="arrow-left"
              className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
            />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Application Details
            </h1>
            {detail?.referenceNumber && (
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {detail.referenceNumber}
              </p>
            )}
          </div>
          {detail && (
            <span
              className={`ml-auto px-3 py-1.5 rounded-full text-xs font-bold ${statusBg} ${statusText}`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-5 text-sm text-red-700 font-medium">
            {loadError}
          </div>
        )}

        {!loading && !loadError && detail && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Section title="Student Details" icon="graduation-cap">
                <Row
                  label="Full Name"
                  value={
                    `${detail.student?.firstName ?? ""} ${detail.student?.lastName ?? ""}`.trim() ||
                    "—"
                  }
                />
                <Row
                  label="Admission Number"
                  value={detail.student?.studentId ?? "Not provided"}
                />
                <Row
                  label="Grade / Level"
                  value={detail.student?.gradeLevel ?? "—"}
                />
                <Row
                  label="Tuition Amount"
                  value={fmt(detail.student?.tuitionAmount)}
                />
              </Section>

              <Section title="Parent / Guardian Details" icon="user">
                <Row
                  label="Full Name"
                  value={
                    detail.student?.parent
                      ? `${detail.student.parent.firstName ?? ""} ${detail.student.parent.lastName ?? ""}`.trim()
                      : "—"
                  }
                />
                <Row
                  label="Email Address"
                  value={detail.student?.parent?.user?.email ?? "—"}
                />
                <Row
                  label="Phone Number"
                  value={detail.student?.parent?.user?.phoneNumber ?? "—"}
                />
              </Section>

              <Section title="School Details" icon="building-2">
                <Row
                  label="School Name"
                  value={
                    detail.catalogSchool?.name ??
                    detail.school?.schoolName ??
                    "—"
                  }
                />
                <Row
                  label="Contact Person"
                  value={detail.school?.contactPerson ?? "—"}
                />
                <Row
                  label="Tier"
                  value={
                    detail.catalogSchool?.tier
                      ? `Tier ${detail.catalogSchool.tier}`
                      : "—"
                  }
                />
                <Row
                  label="Address"
                  value={
                    [
                      detail.school?.addressStreet,
                      detail.school?.addressCity,
                      detail.school?.addressState,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <Row
                  label="Registration Status"
                  value={
                    detail.catalogSchool?.isRegistered ? (
                      <span className="text-green-700 font-semibold">
                        Registered Partner
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        Unregistered
                      </span>
                    )
                  }
                />
              </Section>

              {(detail.school?.bankName ||
                detail.school?.bankAccountNumber) && (
                <Section title="School Bank Account" icon="credit-card">
                  <Row
                    label="Bank Name"
                    value={detail.school?.bankName ?? "—"}
                  />
                  <Row
                    label="Account Number"
                    value={detail.school?.bankAccountNumber ?? "—"}
                  />
                  <Row
                    label="Account Name"
                    value={detail.school?.bankAccountName ?? "—"}
                  />
                </Section>
              )}
            </div>

            <div className="space-y-6">
              <Section title="Application Details" icon="file-text">
                <Row
                  label="Reference ID"
                  value={
                    <span className="font-mono">
                      {detail.referenceNumber ??
                        detail.id.slice(0, 12).toUpperCase()}
                    </span>
                  }
                />
                <Row label="School Fees" value={fmt(detail.amountRequested)} />
                <Row
                  label="Service Charge"
                  value={
                    detail.serviceChargeAmount
                      ? `${fmt(detail.serviceChargeAmount)}${detail.serviceChargeRate ? ` (${(Number(detail.serviceChargeRate) * 100).toFixed(1)}%)` : ""}`
                      : "—"
                  }
                />
                <Row
                  label="Repayment Plan"
                  value={detail.tenor ? `${detail.tenor}-month plan` : "—"}
                />
                <Row label="Date Submitted" value={fmtDate(detail.createdAt)} />
                <Row label="Last Updated" value={fmtDate(detail.updatedAt)} />
                <Row
                  label="Service Fee Paid"
                  value={
                    detail.serviceFeePaid ? (
                      <span className="text-green-700 font-semibold">Paid</span>
                    ) : (
                      <span className="text-slate-400">Not yet paid</span>
                    )
                  }
                />
              </Section>

              {detail.rejectionReason && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    {detail.rejectionReason}
                  </p>
                </div>
              )}

              {actionError && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 font-medium">
                  {actionError}
                </div>
              )}

              {actionDone && !canAct && (
                <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-700 font-semibold text-center">
                  Action recorded successfully.
                </div>
              )}

              {canAct && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    Verify that this student is enrolled at your school and the
                    fee amount is correct before taking action.
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={actioning}
                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {actioning ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon name="check" className="w-4 h-4" />
                    )}
                    Accept Application
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                      setRejectReason("");
                      setRejectError("");
                    }}
                    disabled={actioning}
                    className="w-full flex items-center justify-center gap-2 border-2 border-red-400 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Icon name="x" className="w-4 h-4" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reject Application
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Provide a clear reason. This will be sent to the parent and
              recorded for SkulCredit to follow up.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError("");
              }}
              placeholder="e.g. Student is not currently enrolled at our school, or the fee amount stated is incorrect…"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-colors"
            />
            {rejectError && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {rejectError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-full border-2 border-slate-200 text-slate-600 font-bold py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actioning}
                className="flex-1 rounded-full bg-red-600 text-white font-bold py-2.5 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchoolApplicationDetailPage;
