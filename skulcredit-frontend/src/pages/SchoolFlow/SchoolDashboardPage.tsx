import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { useAuth } from "../../context/AuthContext";
import { schoolService } from "../../services/schoolService";
import { dashboardService } from "../../services/dashboardService";
import { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardStatus = "pending" | "approved" | "active";

interface DashboardData {
  school?: Record<string, unknown>;
  applications?: {
    id: string;
    status: string;
    amount?: number;
    createdAt?: string;
  }[];
  students?: unknown[];
  disbursements?: { id: string; amount?: number; status: string }[];
}

interface RegForm {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// ── Small shared pieces ───────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-800">{value}</span>
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  linkLabel: string;
  to: string;
  onClick: () => void;
}> = ({ icon, label, value, sub, linkLabel, onClick }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-brand mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline mt-auto"
    >
      {linkLabel}
      <Icon name="arrow-right" className="w-3.5 h-3.5" />
    </button>
  </div>
);

const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center gap-3 hover:border-brand/40 hover:shadow-sm transition-all text-center"
  >
    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
      {label}
      <Icon name="arrow-right" className="w-3.5 h-3.5 text-brand" />
    </span>
  </button>
);

// ── Activity icons by keyword ─────────────────────────────────────────────────
const activityIcon = (text: string) => {
  if (/application/i.test(text)) return "file-text";
  if (/payment|disbursement/i.test(text)) return "credit-card";
  if (/document|proof|upload/i.test(text)) return "paperclip";
  if (/verified|verification/i.test(text)) return "shield-check";
  if (/support|ticket/i.test(text)) return "headset";
  return "activity";
};

// ── Main component ────────────────────────────────────────────────────────────

const SchoolDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    school: {},
    applications: [],
    students: [],
    disbursements: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStatus, setDashboardStatus] =
    useState<DashboardStatus>("active");
  const [regForm, setRegForm] = useState<RegForm>({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  const schoolName =
    (user?.schoolName ?? user?.name ?? "Partner School") + " - Partner Portal";

  const myApplications = dashboardData.applications ?? [];
  const pendingCount = myApplications.filter(
    (a) => a.status === "pending_school_approval",
  ).length;
  const verifiedCount = myApplications.filter((a) =>
    ["school_approved", "disbursed"].includes(a.status),
  ).length;
  const totalStudents = dashboardData.students?.length ?? 0;
  const totalDisbursed = (dashboardData.disbursements ?? []).reduce(
    (s, d) => s + (d.amount ?? 0),
    0,
  );

  const RECENT_ACTIVITIES = [
    "New tuition application submitted for *Sarah A.*",
    "Parent uploaded proof-of-income for *Samuel O.*",
    "Student *John Okoro* was marked as verified by the school.",
    "School received a payment of ₦150,000 for *Amaka N*",
    "Pending document update request submitted by the school admin",
    "Application for *Chioma Peter* moved from Pending → Under Review",
    "Disbursement alert: ₦200,000 processed for *HND 1 Students*",
    "Support ticket #20321 was updated by the SchoolCredit team",
  ];

  useEffect(() => {
    (async () => {
      try {
        const data = await dashboardService.getSchoolDashboard();
        setDashboardData(data as DashboardData);
      } catch {
        /* silent */
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const s = new URLSearchParams(location.search).get(
      "status",
    ) as DashboardStatus | null;
    if (s) setDashboardStatus(s);
  }, [location]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!/^\d{10}$/.test(regForm.accountNumber)) {
      setRegError("Account number must be exactly 10 digits.");
      return;
    }
    setRegSubmitting(true);
    try {
      await schoolService.updateBankDetails({
        bankName: regForm.bankName,
        accountName: regForm.accountName,
        accountNumber: regForm.accountNumber,
      });
      setDashboardStatus("active");
      navigate("/school/dashboard");
    } catch (err) {
      const ax = err as AxiosError<{
        errors?: { message: string }[];
        message?: string;
      }>;
      setRegError(
        ax.response?.data?.errors?.[0]?.message ??
          ax.response?.data?.message ??
          "Failed to save bank details.",
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      sidebar={<SchoolSidebar />}
      header={<SchoolTopBar notificationCount={pendingCount} />}
    >
      {/* ════ PENDING ════ */}
      {dashboardStatus === "pending" && (
        <div className="max-w-3xl mx-auto pt-8 space-y-6 animate-fade-in-up">
          {/* Welcome */}
          <div>
            <h1 className="text-xl font-bold text-brand">
              Welcome to your Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{schoolName}</p>
          </div>

          {/* Verification complete banner */}
          <div className="flex items-center justify-between bg-slate-100 rounded-xl px-5 py-3.5">
            <span className="text-sm font-medium text-slate-700">
              Verification Complete
            </span>
            <span className="text-sm text-slate-400">
              You can now manage students, applications, and disbursements.
            </span>
            <button className="text-slate-400 hover:text-slate-600">
              <Icon name="info" className="w-5 h-5" />
            </button>
          </div>

          {/* Under review card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <Icon name="clock" className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 mb-1">
                Application Under Review
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Thank you for registering with SkulCredit! Your school
                application is currently being reviewed by our team.
              </p>

              <div className="bg-white rounded-xl p-4 border border-amber-100">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  What happens next?
                </p>
                {[
                  {
                    n: 1,
                    title: "Document Review",
                    desc: "Our team is reviewing your submitted documents and school information",
                  },
                  {
                    n: 2,
                    title: "On-Site Verification",
                    desc: "We will schedule a visit to verify your school facilities and operations",
                  },
                  {
                    n: 3,
                    title: "Accreditation",
                    desc: "Once approved, you'll be notified to submit bank details to receive disbursements",
                  },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-3 mb-3 last:mb-0">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {title}
                      </p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="clock" className="w-4 h-4 text-amber-600" />
                  <span>
                    Estimated Review Time
                    <br />
                    <strong>3–5 business days</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="phone" className="w-4 h-4 text-amber-600" />
                  <span>
                    Questions?
                    <br />
                    <strong>Schools@skulcredit.com</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ APPROVED — bank details ════ */}
      {dashboardStatus === "approved" && (
        <div className="max-w-lg mx-auto pt-10 animate-fade-in-up">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Icon
                  name="check-circle"
                  className="w-5 h-5 text-emerald-600"
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Your School Has Been Approved!
                </h2>
                <p className="text-sm text-slate-500">
                  Submit bank details to activate your dashboard.
                </p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleBankSubmit}>
              {regError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                  {regError}
                </div>
              )}
              {[
                {
                  label: "Bank Name*",
                  key: "bankName",
                  placeholder: "e.g. Zenith Bank",
                },
                {
                  label: "Account Number*",
                  key: "accountNumber",
                  placeholder: "0123456789",
                },
                {
                  label: "Account Name*",
                  key: "accountName",
                  placeholder: "Official school account name",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    required
                    value={regForm[key as keyof RegForm]}
                    onChange={(e) =>
                      setRegForm({
                        ...regForm,
                        [key]:
                          key === "accountNumber"
                            ? e.target.value.replace(/\D/g, "")
                            : e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full bg-brand text-white font-bold py-3 rounded-full hover:bg-[#7a1848] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {regSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Saving…
                  </>
                ) : (
                  "Activate Dashboard →"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════ ACTIVE — main dashboard ════ */}
      {dashboardStatus === "active" && (
        <div className="max-w-4xl mx-auto pt-8 space-y-8 animate-fade-in-up">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-brand">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-700">
                Your Verification is Complete
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 ml-6">
              Your school is fully onboarded and ready to receive payments.
              Start managing students and applications.
            </p>
          </div>

          {/* Overview stat cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-brand mb-4">Overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={
                      <Icon
                        name="graduation-cap"
                        className="w-6 h-6 text-brand"
                      />
                    }
                    label="Total Student"
                    value={String(totalStudents || 140)}
                    sub=""
                    linkLabel="View Students"
                    to="/school/students"
                    onClick={() => navigate("/school/students")}
                  />
                  <StatCard
                    icon={
                      <Icon name="file-text" className="w-6 h-6 text-brand" />
                    }
                    label="New Applications"
                    value={`${pendingCount || 12} Pending`}
                    sub=""
                    linkLabel="Review Now"
                    to="/school/applications"
                    onClick={() => navigate("/school/applications")}
                  />
                  <StatCard
                    icon={
                      <Icon
                        name="shield-check"
                        className="w-6 h-6 text-brand"
                      />
                    }
                    label="Verified Applications"
                    value={`${verifiedCount || 86} Verified`}
                    sub=""
                    linkLabel="View List"
                    to="/school/applications"
                    onClick={() => navigate("/school/applications")}
                  />
                  <StatCard
                    icon={
                      <Icon name="credit-card" className="w-6 h-6 text-brand" />
                    }
                    label="Payments Received"
                    value={
                      totalDisbursed > 0
                        ? `₦${totalDisbursed.toLocaleString()}`
                        : "₦4,250,000"
                    }
                    sub=""
                    linkLabel="View Payments"
                    to="/school/disbursement"
                    onClick={() => navigate("/school/disbursement")}
                  />
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-slate-800 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickAction
                    icon={
                      <Icon name="user-plus" className="w-6 h-6 text-brand" />
                    }
                    label="Add New Student"
                    onClick={() => navigate("/school/students")}
                  />
                  <QuickAction
                    icon={
                      <Icon name="bar-chart-2" className="w-6 h-6 text-brand" />
                    }
                    label="Generate Report"
                    onClick={() => navigate("/school/disbursement")}
                  />
                  <QuickAction
                    icon={
                      <Icon name="headset" className="w-6 h-6 text-brand" />
                    }
                    label="Contact Support"
                    onClick={() => navigate("/school/support")}
                  />
                  <QuickAction
                    icon={<Icon name="users" className="w-6 h-6 text-brand" />}
                    label="View All Students"
                    onClick={() => navigate("/school/students")}
                  />
                </div>
              </div>

              {/* Recent activities */}
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-4">
                  Recent Activities
                </h2>
                <div className="flex flex-col divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {RECENT_ACTIVITIES.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <Icon
                          name={activityIcon(text)}
                          className="w-4 h-4 text-brand"
                        />
                      </div>
                      <p
                        className="text-sm text-slate-600"
                        dangerouslySetInnerHTML={{
                          __html: text.replace(
                            /\*(.*?)\*/g,
                            "<strong>$1</strong>",
                          ),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchoolDashboardPage;
