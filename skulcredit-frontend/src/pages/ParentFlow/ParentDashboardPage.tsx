import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import DataTable, { Column } from "../../components/DataTable";
import MyApplicationsPage from "./MyApplicationsPage";
import {
  DashboardLayout,
  DashboardTopBar,
  ParentSidebar,
  ParentTab,
  TopBarControls,
  Notification,
} from "../../components/layout";
import { useAuth } from "../../context/AuthContext";
import {
  dashboardService,
  DashboardStats,
  SchoolRequestRecord,
  SchoolRequestStatus,
  ParentDashboardResponse,
} from "../../services/dashboardService";

type ActiveTab = ParentTab;

interface AppRow {
  id: string;
  schoolName?: string;
  amount: number;
  date?: string;
  status: string;
  [key: string]: unknown;
}

const DEFAULT_STATS: DashboardStats = {
  totalApplications: 0,
  activeLoans: 0,
  pendingApplications: 0,
  totalApprovedAmount: 0,
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subLabel: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subLabel,
}) => (
  <div className="bg-white rounded-2xl p-5 border border-[#f0d0de] shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow min-h-[110px]">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-400 tabular-nums">
        {value}
      </span>
    </div>
    {/* Labels */}
    <div>
      <p className="text-sm font-bold text-brand leading-snug">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>
    </div>
  </div>
);

const STATUS_MESSAGES: Record<SchoolRequestStatus, string> = {
  pending:
    "Your request is under review. We'll notify you once it's processed.",
  in_progress: "Your school request is being processed by our team.",
  onboarded:
    "Your school has been onboarded. You can now apply for tuition financing.",
  rejected:
    "Your school request was not approved. Please contact support for details.",
};

const STATUS_PILL_CLS: Record<SchoolRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  onboarded: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const ParentDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequestRecord[]>(
    [],
  );
  const [hasSchoolRequest, setHasSchoolRequest] = useState(false);
  const [myApplications, setMyApplications] = useState<AppRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.name ?? user?.firstName ?? "Parent";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: ParentDashboardResponse =
          await dashboardService.getParentDashboard();
        if (!cancelled) {
          setStats(data.stats ?? DEFAULT_STATS);
          setSchoolRequests(data.schoolRequests ?? []);
          setHasSchoolRequest(data.hasSchoolRequest ?? false);
          setMyApplications((data.applications ?? []) as AppRow[]);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const schoolRequestStatus: SchoolRequestStatus | null =
    schoolRequests[0]?.status ?? null;

  const showIncompleteBanner = !isLoading && !hasSchoolRequest;

  const appColumns: Column<AppRow>[] = [
    {
      header: "App ID",
      accessor: "id",
      render: (r) => <div className="font-mono text-xs">{r.id}</div>,
    },
    {
      header: "School",
      accessor: "schoolName",
      render: (r) => <div className="font-bold">{r.schoolName ?? "—"}</div>,
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (r) => `₦${r.amount.toLocaleString()}`,
    },
    { header: "Date", accessor: "date" },
    {
      header: "Status",
      accessor: "status",
      render: (r) => (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand">
          {r.status.replace(/_/g, " ").toUpperCase()}
        </span>
      ),
    },
  ];

  const searchBar = (
    <div className="hidden md:block relative w-96">
      <Icon
        name="search"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
      />
      <input
        type="text"
        placeholder="Search applications, schools…"
        className="w-full pl-11 pr-4 py-2.5 bg-white border border-brand/40 rounded-full text-sm
                   focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
                   transition-all shadow-sm placeholder:text-slate-400"
      />
    </div>
  );
  const notifications: Notification[] = [
    {
      id: "1",
      title: "Application Approved",
      body: "Your loan application has been approved.",
      time: "2m ago",
      unread: true,
    },
    {
      id: "2",
      title: "Payment Reminder",
      body: "Your repayment is due in 3 days.",
      time: "1h ago",
      unread: true,
    },
    {
      id: "3",
      title: "Profile Incomplete",
      body: "Complete your KYC to proceed.",
      time: "2h ago",
      unread: false,
    },
    {
      id: "4",
      title: "Welcome to SkulCredit",
      body: "Your account has been created.",
      time: "1d ago",
      unread: false,
    },
    {
      id: "5",
      title: "School Verified",
      body: "Foster Prime Schools has been verified.",
      time: "2d ago",
      unread: false,
    },
    {
      id: "6",
      title: "Disbursement Processed",
      body: "₦750,000 has been sent to your school.",
      time: "3d ago",
      unread: false,
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        <ParentSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={
        <DashboardTopBar
          left={searchBar}
          rightExtra={<TopBarControls notifications={notifications} />}
          onMobileMenuOpen={() => setMobileNavOpen(true)}
        />
      }
    >
      {activeTab === "dashboard" && isLoading && (
        <div className="flex h-full items-center justify-center pt-20">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {activeTab === "dashboard" && !isLoading && (
        <div className="space-y-8 pt-8 animate-fade-in-up w-[90%] mx-auto">
          {/* Welcome banner */}
          <div className="bg-brand rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-brand/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <h2 className="text-2xl md:text-4xl font-extrabold">
                Welcome back, {userName.split(" ")[0]}{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block w-7 h-7 md:w-9 md:h-9 align-middle -mt-1 ml-1"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </h2>
              <p className="text-brand-50/80 font-medium max-w-md text-sm md:text-base">
                Ensure your child's education never pauses. Fast, secure, and
                flexible fee financing.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto">
              <button
                onClick={() => navigate("/parent/eligibility")}
                className="w-full md:w-auto bg-white/95 hover:bg-white text-brand font-bold py-4 px-8
                           rounded-2xl transition-all flex items-center justify-center gap-3
                           border border-white/20 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Start Application
                <span className="px-2 py-0.5 bg-brand-light text-white text-[10px] uppercase tracking-wider rounded-md font-extrabold shadow-sm">
                  Apply Now
                </span>
              </button>
            </div>
          </div>
          <section>
            <h3 className="mb-3 text-base font-bold text-gray-800">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75-6.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                      clipRule="evenodd"
                    />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                  </svg>
                }
                label="Total Applications"
                value={isLoading ? "—" : stats.totalApplications}
                subLabel="All time submissions"
              />
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                label="Pending Review"
                value={isLoading ? "—" : stats.pendingApplications}
                subLabel="Awaiting approval"
              />
              <StatCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                label="Total Approved"
                value={
                  isLoading
                    ? "—"
                    : `₦${stats.totalApprovedAmount.toLocaleString()}`
                }
                subLabel="Approved amount"
              />
            </div>
          </section>

          {hasSchoolRequest && schoolRequestStatus && (
            <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F0FDF4] border border-green-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  School registration submitted
                </p>
                <p className="mt-0.5 text-xs text-green-700">
                  {STATUS_MESSAGES[schoolRequestStatus]}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_PILL_CLS[schoolRequestStatus]}`}
              >
                {schoolRequestStatus.replace("_", " ")}
              </span>
            </div>
          )}

          {showIncompleteBanner && (
            <div className="relative flex items-start justify-between gap-4 rounded-xl bg-[#FFF5F0] px-6 py-5 overflow-hidden">
              {/* Left accent bar */}
              <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-orange-400" />
              <div className="pl-2">
                <p className="text-sm font-semibold text-[#8B1C53]">
                  Complete your school registration
                </p>
                <p className="mt-1 text-xs text-[#8B1C53]/80">
                  Register your school to start applying for tuition financing
                  within 48 hours.
                </p>
                <button
                  onClick={() => navigate("/parent/details")}
                  className="mt-4 inline-flex items-center gap-1.5 bg-brand text-white text-xs font-bold
                             px-5 py-2 rounded-full hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Complete Profile &amp; Apply
                </button>
              </div>
              <div className="shrink-0 w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand mt-0.5">
                <Icon name="clock" className="w-5 h-5" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 shadow-sm px-6 py-5">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Need Tuition Support?
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Start a new application and get approved within 48 hours.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("applications")}
              className="shrink-0 inline-flex items-center gap-1.5 bg-brand text-white text-sm font-bold
                         px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
            >
              <Icon name="plus" className="w-4 h-4" />
              New Application
            </button>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <p className="text-sm font-semibold text-slate-800">
                Your Applications
              </p>
            </div>
            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <Icon name="file-text" className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-700 mb-1">
                  No Applications Yet
                </h4>
                <p className="text-sm text-slate-500 max-w-xs mb-5">
                  Start your first application to get tuition support for your
                  child.
                </p>
                <button
                  onClick={() => navigate("/parent/eligibility")}
                  className="inline-flex items-center gap-1.5 bg-brand text-white text-sm font-bold
                             px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  Create Application
                </button>
              </div>
            ) : (
              <DataTable
                columns={appColumns}
                data={myApplications}
                searchPlaceholder="Search applications…"
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "applications" && <MyApplicationsPage />}

      {activeTab === "repayment" && (
        <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">
            Repayment Schedule
          </h2>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center py-12">
            <Icon
              name="credit-card"
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-slate-700">
              No active repayment schedules
            </h3>
            <p className="text-slate-500 mt-2 text-sm">
              Once an application is approved and disbursed, your EMI schedule
              will appear here.
            </p>
          </div>
        </div>
      )}

      {activeTab === "verification" &&
        (() => {
          const verifications = [
            {
              id: "email",
              title: "Email Verification",
              description: "Your email was verified when you signed up",
              status: "verified" as const,
              detail: user?.email ?? "—",
            },
            {
              id: "phone",
              title: "Phone Number Verification",
              description:
                "Verify your phone number for SMS notifications and security",
              status: "unverified" as const,
            },
            {
              id: "identity",
              title: "Identity Verification (BVN/NIN)",
              description:
                "Complete BVN or NIN verification during your loan application",
              status: "unverified" as const,
              note: "Identity verification is completed in Step 4 of the application form. This is required to process your loan request.",
              requiredForApplication: true,
            },
          ];

          const verifiedCount = verifications.filter(
            (v) => v.status === "verified",
          ).length;
          const total = verifications.length;
          const progressPct = Math.round((verifiedCount / total) * 100);

          const whyItems = [
            {
              icon: "check-circle",
              color: "text-green-500",
              bg: "bg-green-50",
              title: "Higher Approval Rate",
              desc: "Verified accounts are 3x more likely to get approved",
            },
            {
              icon: "clock",
              color: "text-blue-500",
              bg: "bg-blue-50",
              title: "Faster Processing",
              desc: "Applications process up to 50% faster",
            },
            {
              icon: "lock",
              color: "text-purple-500",
              bg: "bg-purple-50",
              title: "Enhanced Security",
              desc: "Protect your account from unauthorized access",
            },
            {
              icon: "file-text",
              color: "text-orange-500",
              bg: "bg-orange-50",
              title: "Better Loan Terms",
              desc: "Access to more favorable rates and limits",
            },
          ];

          const MarkedIcon = ({
            className = "w-8 h-8",
          }: {
            className?: string;
          }) => (
            <img
              src="/marked-icon.svg"
              alt=""
              aria-hidden="true"
              className={className}
            />
          );
          const PhoneIcon = () => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
          );
          const ShieldIcon = () => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          );

          return (
            <div className="flex flex-col gap-4 pt-8 animate-fade-in-up w-[85%] mx-auto">
              <div className="bg-white rounded-2xl border-2 border-brand/30 px-6 py-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    {/* Shield in gray circle */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <ShieldIcon />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Verification Progress
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {verifiedCount} of {total} verifications completed
                      </p>
                    </div>
                  </div>
                  {/* % pill */}
                  <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {progressPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Why verify hint */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-blue-700">Why verify?</span>{" "}
                    Verified accounts have higher approval rates and faster
                    processing times. Complete all verifications to unlock full
                    platform benefits.
                  </p>
                </div>
              </div>
              {verifications.map((item) => {
                const isVerified = item.status === "verified";
                const isIdentity = item.id === "identity";
                const isPhone = item.id === "phone";

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-6 py-5 flex items-center justify-between gap-4 ${
                      isVerified
                        ? "bg-[#F0FDF4] border-green-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* Left: icon + text */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Circle icon */}
                      <div
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isVerified
                            ? "bg-green-100 text-green-600"
                            : isPhone
                              ? "bg-slate-100 text-slate-500"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {isVerified || isIdentity ? (
                          <MarkedIcon className="w-10 h-10" />
                        ) : (
                          <PhoneIcon />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-800">
                            {item.title}
                          </span>
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3 h-3"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.236 4.53L7.53 9.96a.75.75 0 0 0-1.06 1.062l2.25 2.25a.75.75 0 0 0 1.275-.257l3.75-5.25Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Verified
                            </span>
                          )}
                          {item.requiredForApplication && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-orange-300 text-orange-600 bg-white">
                              Required for Application
                            </span>
                          )}
                        </div>
                        {/* Detail (email address) */}
                        {(item as { detail?: string }).detail && (
                          <p className="text-xs text-slate-600 font-medium mb-0.5">
                            {(item as { detail?: string }).detail}
                          </p>
                        )}
                        {/* Description */}
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                        {/* Note */}
                        {(item as { note?: string }).note && (
                          <p className="text-xs text-slate-400 mt-1">
                            {(item as { note?: string }).note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: action */}
                    <div className="shrink-0">
                      {isVerified ? (
                        <MarkedIcon className="w-8 h-8" />
                      ) : isIdentity ? (
                        <button
                          onClick={() => navigate("/parent/eligibility")}
                          className="inline-flex items-center bg-brand text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm whitespace-nowrap"
                        >
                          Start Application
                        </button>
                      ) : (
                        <button className="inline-flex items-center bg-brand text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm">
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-brand">
                    <ShieldIcon />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Why Verification Matters
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Completing all verifications helps us serve you better and
                  improves your loan application success rate.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {whyItems.map((w) => (
                    <div
                      key={w.title}
                      className="rounded-xl border border-slate-200 p-4 flex flex-col gap-3"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${w.bg}`}
                      >
                        <Icon name={w.icon} className={`w-5 h-5 ${w.color}`} />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {w.title}
                      </p>
                      <p className="text-xs text-slate-500">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      {activeTab === "support" && (
        <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">Help & Support</h2>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-slate-600 mb-4">
              Need assistance? Contact our support team.
            </p>
            <button className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-light transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ParentDashboardPage;
