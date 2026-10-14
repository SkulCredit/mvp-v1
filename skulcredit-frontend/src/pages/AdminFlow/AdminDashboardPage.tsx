import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardSettings } from "./components/DashboardSettingsDrawer";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";

const BRAND = "#7A0E42";

interface DashboardStats {
  totalParents: number;
  totalSchools: number;
  pendingSchools: number;
  pendingLoans: number;
  approvedLoans: number;
  disbursedLoans: number;
  totalApplications: number;
  totalRevenue: number;
  totalDisbursed: number;
}

interface AppStat {
  period: string;
  total: number;
  approved: number;
  rejected: number;
  disbursed: number;
  pending: number;
}

interface StatRow { label: string; value: string }

const StatCard: React.FC<{
  heading: string; total: string; rows: StatRow[]; accent?: string; loading?: boolean;
}> = ({ heading, total, rows, accent, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col min-w-0">
    <div className="border-l-2 pl-3 mb-5" style={{ borderColor: accent ?? BRAND }}>
      <p className="text-xs text-gray-500 mb-1">{heading}</p>
      {loading
        ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        : <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{total}</p>
      }
    </div>
    <div className="flex flex-col">
      {rows.map((r, i) => (
        <div key={i} className={["py-2.5", i < rows.length - 1 ? "border-b border-gray-100" : ""].join(" ")}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-0.5">{r.label}</p>
          {loading
            ? <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            : <p className="text-sm font-bold text-gray-800">{r.value}</p>
          }
        </div>
      ))}
    </div>
  </div>
);

const AttentionCard: React.FC<{
  count: number; label: string; onOpen: () => void; loading?: boolean;
}> = ({ count, label, onOpen, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col gap-3">
    {loading
      ? <div className="h-6 w-10 bg-gray-100 rounded animate-pulse" />
      : <p className="text-lg font-bold" style={{ color: BRAND }}>{count}</p>
    }
    <p className="text-sm text-gray-700 flex-1 leading-snug">{label}</p>
    <button onClick={onOpen}
            className="self-start px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: BRAND }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}>
      Open
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5].map(i => (
      <td key={i} className="px-5 py-3.5">
        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${40 + i * 15}px` }} />
      </td>
    ))}
  </tr>
);

const fmtNum  = (n: number) => n.toLocaleString("en-NG");
const fmtNgn  = (n: number) => `₦${(n / 1_000_000).toFixed(1)}M`;

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] ?? "Admin";
  const { settings } = useDashboardSettings();

  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [appStats,     setAppStats]     = useState<AppStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApp,   setLoadingApp]   = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ data: { stats: DashboardStats } }>("/admin/dashboard")
      .then(res => setStats(res.data.data.stats))
      .catch(err => setError((err as { message?: string }).message ?? "Failed to load dashboard"))
      .finally(() => setLoadingStats(false));

    apiClient.get<{ data: AppStat[] }>("/admin/analytics/applications?period=month&groupBy=month")
      .then(res => setAppStats(res.data.data ?? []))
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingApp(false));
  }, []);

  const STAT_CARDS = [
    {
      heading: "All Schools",
      total: stats ? fmtNum(stats.totalSchools) : "—",
      rows: [
        { label: "Total Schools",       value: stats ? fmtNum(stats.totalSchools)   : "—" },
        { label: "Pending KYC Review",  value: stats ? fmtNum(stats.pendingSchools) : "—" },
      ],
    },
    {
      heading: "Applications",
      total: stats ? fmtNum(stats.totalApplications) : "—",
      rows: [
        { label: "Total",          value: stats ? fmtNum(stats.totalApplications) : "—" },
        { label: "Pending",        value: stats ? fmtNum(stats.pendingLoans)      : "—" },
        { label: "Approved",       value: stats ? fmtNum(stats.approvedLoans)     : "—" },
        { label: "Disbursed",      value: stats ? fmtNum(stats.disbursedLoans)    : "—" },
      ],
    },
    {
      heading: "Disbursements",
      total: stats ? fmtNgn(stats.totalDisbursed) : "—",
      rows: [
        { label: "Total Disbursed", value: stats ? fmtNgn(stats.totalDisbursed) : "—" },
      ],
    },
    {
      heading: "Revenue",
      total: stats ? fmtNgn(stats.totalRevenue) : "—",
      accent: "#b91c1c",
      rows: [
        { label: "Service Charge Collected", value: stats ? fmtNgn(stats.totalRevenue) : "—" },
        { label: "Parents on Platform",      value: stats ? fmtNum(stats.totalParents)  : "—" },
      ],
    },
  ];

  const ATTENTION_ITEMS = [
    { count: stats?.pendingLoans    ?? 0, label: "Applications in manual review",      onOpen: () => navigate("/admin/applications") },
    { count: stats?.pendingSchools  ?? 0, label: "Schools awaiting KYC verification",  onOpen: () => navigate("/admin/schools")      },
    { count: 0,                           label: "Failed disbursements",               onOpen: () => navigate("/admin/disbursements") },
    { count: 0,                           label: "Overdue repayment accounts",         onOpen: () => navigate("/admin/collections")  },
    { count: 0,                           label: "Compliance items open",              onOpen: () => navigate("/admin/compliance")   },
    { count: 0,                           label: "Open support tickets",               onOpen: () => navigate("/admin/support")      },
  ];

  const recentAppRows = appStats.slice(-6).map(r => ({
    period:  r.period,
    total:   fmtNum(r.total),
    pending: fmtNum(r.pending),
    approved:fmtNum(r.approved),
    disbursed:fmtNum(r.disbursed),
  }));

  const maxW = settings.contentWidth === "full" ? "max-w-none" : "max-w-[1100px]";
  const py   = settings.compactMode ? "py-4 sm:py-5" : "py-6 sm:py-8";
  const gap  = settings.compactMode ? "space-y-5" : "space-y-8";

  return (
    <div className={`${maxW} mx-auto ${py} ${gap}`}>

      {settings.showWelcomeBar && (
        <p className="text-sm text-gray-500">
          Performance Insights Dashboard · welcome back,{" "}
          <span className="font-semibold text-gray-700">{firstName}</span>
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2" style={{ color: BRAND }}>
          Platform Performance
          <span className="text-gray-400 font-normal text-sm">live data</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card, i) => (
            <StatCard key={i} {...card} loading={loadingStats} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-4">Needs attention</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ATTENTION_ITEMS.map((item, i) => (
            <AttentionCard key={i} {...item} loading={loadingStats} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 shrink-0">
            Application Trend <span className="text-gray-400 font-normal text-xs">(last 6 months)</span>
          </h2>
          <button onClick={() => navigate("/admin/applications")}
                  className="text-xs sm:text-sm font-semibold border border-gray-200 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors whitespace-nowrap bg-white">
            View all applications
          </button>
        </div>

        <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["PERIOD", "TOTAL", "PENDING", "APPROVED", "DISBURSED"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingApp
                  ? [1,2,3].map(i => <SkeletonRow key={i} />)
                  : recentAppRows.length === 0
                    ? <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No application data yet.</td></tr>
                    : recentAppRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600 font-mono text-xs whitespace-nowrap">{row.period}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">{row.total}</td>
                      <td className="px-5 py-3.5 text-amber-600">{row.pending}</td>
                      <td className="px-5 py-3.5 text-green-600">{row.approved}</td>
                      <td className="px-5 py-3.5 text-blue-600">{row.disbursed}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden flex flex-col gap-3">
          {loadingApp
            ? [1,2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20 animate-pulse" />)
            : recentAppRows.map((row, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
              <p className="font-mono text-xs text-gray-400">{row.period}</p>
              <div className="flex flex-wrap gap-3 mt-1">
                <span className="text-xs"><span className="font-bold text-gray-900">{row.total}</span> <span className="text-gray-400">total</span></span>
                <span className="text-xs text-amber-600">{row.pending} pending</span>
                <span className="text-xs text-green-600">{row.approved} approved</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
