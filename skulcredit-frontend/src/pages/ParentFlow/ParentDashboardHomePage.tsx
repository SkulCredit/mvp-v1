import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import Icon from "../../components/Icon";
import DataTable, { Column } from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import {
  dashboardService,
  DashboardStats,
  SchoolRequestRecord,
  SchoolRequestStatus,
  ParentDashboardResponse,
} from "../../services/dashboardService";
import apiClient from "../../services/apiClient";
import Button from "../../components/ui/Button";
import { PlusIcon } from "lucide-react";

interface AppRow {
  id: string;
  schoolName?: string;
  amount: number;
  date?: string;
  status: string;
  [key: string]: unknown;
}

interface CurrentTermData {
  id: string;
  name: string;
  academicYear: string;
  portalOpenDate: string;
  portalCloseDate: string;
  maxTenorMonths: number;
  effectiveTenor: number;
}

const DEFAULT_STATS: DashboardStats = {
  totalApplications: 0,
  activeLoans: 0,
  pendingApplications: 0,
  totalApprovedAmount: 0,
};
const TERM_MODAL_SEEN_KEY = "skulcredit_term_modal_seen_id";

const NewTermModal: React.FC<{
  firstName: string;
  termName: string;
  academicYear: string;
  onYes: () => void;
  onNo: () => void;
}> = ({ firstName, termName, academicYear, onYes, onNo }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-term-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-brand px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <h2
                id="new-term-modal-title"
                className="text-base font-bold text-white leading-snug"
              >
                New School Term
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {termName} &middot; {academicYear}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            Welcome back, <strong>{firstName}</strong>! It&apos;s a new school
            term ({termName}). Would you like to add a new child/student so you
            can easily pay their school fees?
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onNo}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onYes}
            className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-[#7a1848] transition-colors shadow-sm"
          >
            Yes, add student
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );

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

const ParentDashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.name ?? user?.firstName ?? "Parent";

  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequestRecord[]>(
    [],
  );
  const [hasSchoolRequest, setHasSchoolRequest] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [myApplications, setMyApplications] = useState<AppRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTermModal, setShowTermModal] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<CurrentTermData | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: { isOpen: boolean; term: CurrentTermData | null } }>(
        "/parents/current-term",
      )
      .then(({ data }) => {
        const term = data.data.term;
        if (!data.data.isOpen || !term) return;
        const seenId = localStorage.getItem(TERM_MODAL_SEEN_KEY);
        if (seenId !== term.id) {
          setCurrentTerm(term);
          setShowTermModal(true);
          localStorage.setItem(TERM_MODAL_SEEN_KEY, term.id);
        }
      })
      .catch(() => {

      });
  }, []);

  const handleTermModalYes = () => {
    setShowTermModal(false);
    navigate("/parent/settings");
  };

  const handleTermModalNo = () => {
    setShowTermModal(false);
  };

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
          setKycStatus(data.kycStatus ?? "pending");
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
  const showIncompleteBanner = !isLoading && kycStatus !== "approved";

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-8 animate-fade-in-up w-[90%] mx-auto">
      {/* ── New-term modal — shown once per term, keyed on term ID from DB ── */}
      {showTermModal && currentTerm && (
        <NewTermModal
          firstName={userName.split(" ")[0]}
          termName={currentTerm.name}
          academicYear={currentTerm.academicYear}
          onYes={handleTermModalYes}
          onNo={handleTermModalNo}
        />
      )}

      {/* ── Welcome banner ── */}
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
                       border border-white/20 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Start Application
            <span className="px-2 py-0.5 bg-brand-light text-white text-[10px] uppercase tracking-wider rounded-md font-extrabold shadow-sm">
              Apply Now
            </span>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
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
            value={stats.totalApplications}
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
            value={stats.pendingApplications}
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
            value={`₦${stats.totalApprovedAmount.toLocaleString()}`}
            subLabel="Approved amount"
          />
        </div>
      </section>

      {/* ── School request status ── */}
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

      {/* ── Incomplete-profile banner ── */}
      {showIncompleteBanner && (
        <div className="relative flex items-start justify-between gap-4 rounded-xl bg-[#FFF5F0] px-6 py-5 overflow-hidden">
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
              onClick={() => navigate("/parent/eligibility")}
              className="mt-4 inline-flex items-center gap-1.5 bg-brand text-white text-xs font-bold px-5 py-2 rounded-full hover:bg-brand-hover transition-colors shadow-sm"
            >
              Complete Profile &amp; Apply
            </button>
          </div>
          <div className="shrink-0 w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand mt-0.5">
            <Icon name="clock" className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* ── Tuition support CTA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
        <div>
          <p className="text-sm font-bold text-gray-800">
            Need Tuition Support?
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Start a new application and get approved within 48 hours
          </p>
        </div>
        <Button
          className="flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
          onClick={() => navigate("/parent/details")}
        >
          <PlusIcon />
          New Application
        </Button>
      </div>

      {/* ── Applications preview table ── */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            Your Applications
          </p>
          {myApplications.length > 0 && (
            <Link
              to="/parent/applications"
              className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
            >
              View all →
            </Link>
          )}
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
              onClick={() => navigate("/parent/details")}
              className="inline-flex items-center gap-1.5 bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
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
  );
};

export default ParentDashboardHomePage;
