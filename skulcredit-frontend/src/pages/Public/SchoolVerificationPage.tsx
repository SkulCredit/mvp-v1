import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";

interface ApplicationDetail {
  loanApplication: {
    id: string;
    referenceNumber: string | null;
    amountRequested: number;
    serviceChargeAmount: number | null;
    tenor: number;
    status: string;
    adminNote: string | null;
    createdAt: string;
    catalogSchool: { id: string; name: string } | null;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      gradeLevel: string | null;
      studentId: string | null;
    } | null;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
      addressCity: string | null;
      addressState: string | null;
    } | null;
  };
  schoolName: string;
  contactEmail: string | null;
  expiresAt: string;
  usedAt: string | null;
  action: "confirmed" | "rejected" | null;
}

const fmtMoney = (n: number | null | undefined) =>
  n != null ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });

const BRAND = "#881337";

const SchoolVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [acting, setActing] = useState(false);
  const [done, setDone] = useState<"confirmed" | "rejected" | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiClient
      .get<{ data: ApplicationDetail }>(`/school-verification/${token}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError((err as { message?: string }).message ?? "Invalid or expired link"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setActing(true);
    try {
      await apiClient.post(`/school-verification/${token}`, { action: "confirmed" });
      setDone("confirmed");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Action failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason for rejecting this application.");
      return;
    }
    if (!token) return;
    setActing(true);
    setRejectError("");
    try {
      await apiClient.post(`/school-verification/${token}`, {
        action: "rejected",
        rejectionNote: rejectReason.trim(),
      });
      setDone("rejected");
      setRejectModalOpen(false);
    } catch (err) {
      setRejectError((err as { message?: string }).message ?? "Action failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
          <p className="text-sm text-gray-500">{error ?? "This verification link is no longer valid. Please contact the team that sent it."}</p>
        </div>
      </div>
    );
  }

  if (done === "confirmed" || data.usedAt) {
    const finalAction = done ?? data.action;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: finalAction === "confirmed" ? "#f0fdf4" : "#fef2f2" }}>
            {finalAction === "confirmed" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {finalAction === "confirmed" ? "Application Confirmed" : "Application Rejected"}
          </h2>
          <p className="text-sm text-gray-500">
            {finalAction === "confirmed"
              ? "Thank you. The application has been confirmed and the parent has been notified."
              : "The application has been rejected and the parent has been notified."}
          </p>
        </div>
      </div>
    );
  }

  const app = data.loanApplication;
  const student = app.student;
  const parent = app.parent;
  const school = app.catalogSchool;

  return (
    <>
      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason. This will be sent to the parent.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
              rows={4}
              placeholder="e.g. The student is not enrolled at this school for the stated academic session."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
            />
            {rejectError && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{rejectError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setRejectModalOpen(false); setRejectReason(""); setRejectError(""); }}
                disabled={acting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={acting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {acting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {acting ? "Rejecting…" : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: BRAND }}>S</div>
              <span className="font-bold text-gray-900 text-lg">SkulCredit</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">School Fee Application Verification</h1>
            <p className="mt-1 text-sm text-gray-500">
              A parent has applied for school-fee financing through SkulCredit. Please review and confirm or reject below.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900">Application Details</h2>
              {app.referenceNumber && (
                <span className="ml-auto text-xs font-mono font-semibold" style={{ color: BRAND }}>{app.referenceNumber}</span>
              )}
            </div>
            <div className="px-6 py-2 divide-y divide-gray-50">
              {[
                { label: "School", value: school?.name ?? data.schoolName },
                { label: "Tuition Amount Requested", value: fmtMoney(app.amountRequested) },
                { label: "Repayment Tenor", value: app.tenor ? `${app.tenor} months` : "—" },
                { label: "Application Date", value: fmtDate(app.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {student && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422A12.083 12.083 0 0 1 12 21a12.083 12.083 0 0 1-6.16-10.422L12 14z" />
                </svg>
                <h2 className="text-sm font-bold text-gray-900">Student Information</h2>
              </div>
              <div className="px-6 py-2 divide-y divide-gray-50">
                {[
                  { label: "Full Name", value: `${student.firstName} ${student.lastName}` },
                  { label: "Admission / Student ID", value: student.studentId ?? "—" },
                  { label: "Class / Grade Level", value: student.gradeLevel ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parent && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <h2 className="text-sm font-bold text-gray-900">Parent / Guardian</h2>
              </div>
              <div className="px-6 py-2 divide-y divide-gray-50">
                {[
                  { label: "Name", value: `${parent.firstName} ${parent.lastName}` },
                  { label: "Location", value: [parent.addressCity, parent.addressState].filter(Boolean).join(", ") || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 rounded-2xl border border-amber-200 px-6 py-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Important — what happens next</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-700">
              <li><strong>Confirm</strong> if the student is enrolled at your school and the fee amount is correct. The parent will be notified to pay the service charge to proceed.</li>
              <li><strong>Reject</strong> if the student is not enrolled or the details are incorrect. The parent will receive a rejection notification.</li>
              <li>This link expires on <strong>{fmtDate(data.expiresAt)}</strong> and can only be used once.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => setRejectModalOpen(true)}
              disabled={acting}
              className="flex-1 rounded-2xl border-2 border-red-300 py-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Reject Application
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={acting}
              className="flex-1 rounded-2xl py-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: BRAND }}
            >
              {acting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {acting ? "Processing…" : "Confirm Application"}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 pb-6">
            Powered by SkulCredit · School-fee financing platform
          </p>
        </div>
      </div>
    </>
  );
};

export default SchoolVerificationPage;
