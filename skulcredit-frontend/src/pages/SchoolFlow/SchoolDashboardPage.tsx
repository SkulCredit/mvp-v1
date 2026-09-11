import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../../components/Icon";
import DataTable, { Column } from "../../components/DataTable";
import {
  DashboardLayout,
  DashboardTopBar,
  SchoolSidebar,
} from "../../components/layout";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import { schoolService } from "../../services/schoolService";
import { AxiosError } from "axios";

type DashboardStatus = "pending" | "approved" | "active";
type ActiveTab =
  | "dashboard"
  | "students"
  | "applications"
  | "verification"
  | "disbursements";

interface AppRow {
  id: string;
  parentName?: string;
  amount: number;
  date?: string;
  status: string;
  [key: string]: unknown;
}
interface DisbRow {
  id: string;
  amount: number;
  status: string;
  date?: string;
  [key: string]: unknown;
}
interface DashboardData {
  school?: Record<string, unknown>;
  applications?: AppRow[];
  students?: unknown[];
  disbursements?: DisbRow[];
}
interface RegForm {
  bankName: string;
  accountNumber: string;
  accountName: string;
  contactPerson: string;
}

const SchoolDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
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
    contactPerson: "",
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const myApplications: AppRow[] = (dashboardData.applications ??
    []) as AppRow[];
  const myDisbursements: DisbRow[] = (dashboardData.disbursements ??
    []) as DisbRow[];
  const totalStudents = dashboardData.students?.length ?? 0;

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

  const completeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!/^\d{10}$/.test(regForm.accountNumber)) {
      setRegError("Account number must be exactly 10 numeric digits.");
      return;
    }
    setRegSubmitting(true);
    try {
      await schoolService.updateBankDetails({
        bankName: regForm.bankName,
        accountName: regForm.accountName,
        accountNumber: regForm.accountNumber,
      });
      if (regForm.contactPerson)
        await schoolService.updateProfile({
          contactPerson: regForm.contactPerson,
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
          "Failed to complete registration.",
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  const appColumns: Column<AppRow>[] = [
    {
      header: "App ID",
      accessor: "id",
      render: (r) => <div className="font-mono text-xs">{r.id}</div>,
    },
    {
      header: "Parent Name",
      accessor: "parentName",
      render: (r) => <div className="font-bold">{r.parentName ?? "—"}</div>,
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
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
          {String(r.status).replace(/_/g, " ").toUpperCase()}
        </span>
      ),
    },
  ];

  /* ── Top-bar right: user avatar ─── */
  const avatarBtn = (
    <button className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white shadow-sm hover:bg-white transition-all">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white shadow-inner">
        <Icon name="user" className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-slate-700 hidden sm:block">
        Admin
      </span>
      <Icon
        name="chevron-down"
        className="w-4 h-4 text-slate-400 hidden sm:block"
      />
    </button>
  );

  return (
    <DashboardLayout
      sidebar={<SchoolSidebar />}
      header={
        <DashboardTopBar
          notificationCount={dashboardStatus === "approved" ? 1 : 0}
          rightExtra={avatarBtn}
        />
      }
      bgDecorations={
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-rose-200/20 rounded-full blur-[100px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none -z-10" />
        </>
      }
    >
      {/* ═══ PENDING ═══ */}
      {dashboardStatus === "pending" && activeTab === "dashboard" && (
        <div className="max-w-[800px] mx-auto space-y-8 pt-6 animate-fade-in-up">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <Icon
              name="clock"
              className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
            />
            <div>
              <h3 className="font-bold text-amber-900 text-lg mb-1">
                Your application is currently under review.
              </h3>
              <p className="text-amber-700 text-sm font-medium">
                Verification usually takes up to 24 hours. We'll notify you once
                a decision has been made.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-4">
              We'll notify you once a decision has been made.
            </p>
            <button
              onClick={() => setDashboardStatus("approved")}
              className="text-xs font-bold text-brand border border-brand/20 bg-brand/5 px-4 py-2 rounded-lg hover:bg-brand/10 transition-colors"
            >
              [Prototype] Simulate Approval
            </button>
          </div>
        </div>
      )}

      {/* ═══ APPROVED – complete registration ═══ */}
      {dashboardStatus === "approved" && activeTab === "dashboard" && (
        <div className="max-w-[800px] mx-auto space-y-8 pt-6 animate-fade-in-up">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full text-white flex items-center justify-center shadow-lg">
              <Icon name="party-popper" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-xl mb-1">
                Your school has been approved! 🎉
              </h3>
              <p className="text-emerald-700 text-sm font-medium">
                Please complete your registration to activate your dashboard.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-6 border-b border-slate-100 pb-4">
              Complete Registration
            </h2>
            <form onSubmit={completeRegistration} className="space-y-6">
              {regError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                  {regError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    label: "Bank Name*",
                    key: "bankName",
                    placeholder: "e.g. Zenith Bank",
                    colSpan: "",
                  },
                  {
                    label: "Account Number*",
                    key: "accountNumber",
                    placeholder: "0123456789",
                    colSpan: "",
                  },
                  {
                    label: "Account Name (Must match School Name)*",
                    key: "accountName",
                    placeholder: "Official Account Name",
                    colSpan: "md:col-span-2",
                  },
                  {
                    label: "Primary Contact Person for Finance*",
                    key: "contactPerson",
                    placeholder: "Full Name",
                    colSpan: "md:col-span-2",
                  },
                ].map(({ label, key, placeholder, colSpan }) => (
                  <div key={key} className={colSpan}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand outline-none transition-all text-sm shadow-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 group disabled:opacity-70"
              >
                {regSubmitting
                  ? "Activating…"
                  : "Complete Setup & Activate Dashboard"}
                {!regSubmitting && (
                  <Icon
                    name="arrow-right"
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ACTIVE – loading ═══ */}
      {dashboardStatus === "active" &&
        activeTab === "dashboard" &&
        isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

      {/* ═══ ACTIVE – main dashboard ═══ */}
      {dashboardStatus === "active" &&
        activeTab === "dashboard" &&
        !isLoading && (
          <div className="max-w-[1200px] mx-auto space-y-8 pt-6 animate-fade-in-up">
            {/* Verified banner */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Icon name="shield-check" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                    Dashboard Activated
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Your institution is verified and ready to process
                    applications.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: "Total Students",
                  value: totalStudents,
                  icon: "users",
                },
                {
                  label: "New Applications",
                  value: myApplications.filter(
                    (a) => a.status === "pending_school_approval",
                  ).length,
                  icon: "file-clock",
                },
                {
                  label: "Verified Apps",
                  value: myApplications.filter((a) => a.status === "disbursed")
                    .length,
                  icon: "file-check-2",
                },
                {
                  label: "Disbursed Funds",
                  value: `₦${myDisbursements.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}`,
                  icon: "badge-dollar-sign",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-[2rem] bg-white/40 p-6 border border-white cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand shadow-sm border border-brand/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon name={s.icon} className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    {s.label}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {s.value}
                  </h3>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    icon: "user-plus",
                    title: "Add Student",
                    sub: "Register new profile",
                    onClick: () => setActiveTab("students"),
                    primary: false,
                  },
                  {
                    icon: "bar-chart-3",
                    title: "Generate Report",
                    sub: "Download CSV data",
                    onClick: () => {},
                    primary: false,
                  },
                  {
                    icon: "headset",
                    title: "Get Support",
                    sub: "Open a new ticket",
                    onClick: () => {},
                    primary: false,
                  },
                  {
                    icon: "arrow-right",
                    title: "Review Applications",
                    sub: `${myApplications.length} requests`,
                    onClick: () => setActiveTab("applications"),
                    primary: true,
                  },
                ].map((a, i) => (
                  <button
                    key={i}
                    onClick={a.onClick}
                    className={`rounded-3xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group text-left ${a.primary ? "bg-gradient-to-br from-brand to-brand-light hover:shadow-[0_15px_30px_-10px_rgba(136,19,55,0.4)]" : "bg-white/80 backdrop-blur-md border border-white hover:shadow-[0_12px_24px_-10px_rgba(136,19,55,0.1)]"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${a.primary ? "bg-white/20 text-white group-hover:scale-110" : "bg-slate-50 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand"}`}
                    >
                      <Icon name={a.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-sm ${a.primary ? "text-white" : "text-slate-900"}`}
                      >
                        {a.title}
                      </h4>
                      <p
                        className={`text-xs font-medium ${a.primary ? "text-brand-50" : "text-slate-500"}`}
                      >
                        {a.sub}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ═══ APPLICATIONS TAB ═══ */}
      {dashboardStatus === "active" && activeTab === "applications" && (
        <div className="max-w-[1200px] mx-auto space-y-6 pt-6 animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Student Applications
          </h2>
          <DataTable
            columns={appColumns}
            data={myApplications}
            searchPlaceholder="Search applications…"
          />
        </div>
      )}

      {/* ═══ STUDENTS TAB ═══ */}
      {dashboardStatus === "active" && activeTab === "students" && (
        <div className="max-w-[1200px] mx-auto space-y-6 pt-6 animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Students Directory
          </h2>
          <div className="bg-white/60 backdrop-blur-md p-10 rounded-3xl border border-white text-center shadow-sm">
            <Icon
              name="users"
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-slate-700">
              Student list will appear here
            </h3>
            <p className="text-sm text-slate-500">
              Integration with school database pending.
            </p>
          </div>
        </div>
      )}

      {/* ═══ VERIFICATION TAB ═══ */}
      {dashboardStatus === "active" && activeTab === "verification" && (
        <div className="max-w-[1200px] mx-auto space-y-6 pt-6 animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Verification
          </h2>
          <div className="bg-white/60 backdrop-blur-md p-10 rounded-3xl border border-white text-center shadow-sm">
            <Icon
              name="shield-check"
              className="w-12 h-12 text-emerald-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-emerald-700">
              School KYC Verified
            </h3>
            <p className="text-sm text-slate-500">
              Your institution has been successfully verified by SkulCredit.
            </p>
          </div>
        </div>
      )}

      {/* ═══ DISBURSEMENTS TAB ═══ */}
      {dashboardStatus === "active" && activeTab === "disbursements" && (
        <div className="max-w-[1200px] mx-auto space-y-6 pt-6 animate-fade-in-up">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Disbursements
          </h2>
          <DataTable
            columns={[
              { header: "Disbursement ID", accessor: "id" },
              {
                header: "Amount",
                accessor: "amount",
                render: (r) => `₦${(r as DisbRow).amount.toLocaleString()}`,
              },
              {
                header: "Status",
                accessor: "status",
                render: (r) => (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {String((r as DisbRow).status).toUpperCase()}
                  </span>
                ),
              },
              { header: "Date", accessor: "date" },
            ]}
            data={myDisbursements as Record<string, unknown>[]}
            searchPlaceholder="Search disbursements…"
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchoolDashboardPage;
