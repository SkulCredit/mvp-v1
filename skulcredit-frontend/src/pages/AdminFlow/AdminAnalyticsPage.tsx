import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import apiClient from "../../services/apiClient";
import { BRAND } from "./components/shared";

const C_PRIMARY   = "#7A0E42";
const C_SECONDARY = "#e11d48";
const C_ACCENT    = "#f43f5e";
const C_SUCCESS   = "#16a34a";
const C_INFO      = "#2563eb";
const C_MUTED     = "#94a3b8";
const C_AMBER     = "#f59e0b";
const C_RED       = "#ef4444";

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

interface RevStat {
  period: string;
  revenue: number;
  serviceCharges: number;
}

interface MarketProjection {
  projectedRevenue?: number;
  projectedApplications?: number;
  marketSize?: number;
  penetrationRate?: number;
}

type TimeRange = "This Month" | "Last 3 Months" | "Last 6 Months" | "This Year";
type TabKey = "Overview" | "Loan Performance" | "Revenue" | "School & Parent Growth";

const TIME_OPTIONS: TimeRange[] = ["This Month", "Last 3 Months", "Last 6 Months", "This Year"];
const TABS: TabKey[] = ["Overview", "Loan Performance", "Revenue", "School & Parent Growth"];

function periodParams(range: TimeRange): string {
  if (range === "This Month")     return "period=week&groupBy=week";
  if (range === "Last 3 Months")  return "period=3month&groupBy=month";
  if (range === "Last 6 Months")  return "period=month&groupBy=month";
  return "period=year&groupBy=month";
}

const fmtNum = (n: number) => n.toLocaleString("en-NG");
const fmtNgn = (n: number) => `₦${(n / 1_000_000).toFixed(1)}M`;
const fmtNgnFull = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const pct  = (a: number, b: number) => b === 0 ? "0.0%" : `${((a / b) * 100).toFixed(1)}%`;

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  loading?: boolean;
}> = ({ label, value, sub, accent, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col min-w-0">
    <div className="border-l-2 pl-3 mb-3" style={{ borderColor: accent ?? BRAND }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading
        ? <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        : <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      }
    </div>
    {sub && !loading && (
      <p className="text-xs text-gray-400">{sub}</p>
    )}
    {sub && loading && <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />}
  </div>
);

const SmallStat: React.FC<{ label: string; value: string; color?: string; loading?: boolean }> = ({
  label, value, color, loading,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
    {loading
      ? <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
      : <p className="text-xl font-bold" style={{ color: color ?? C_PRIMARY }}>{value}</p>
    }
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-bold text-gray-700 mb-3">{children}</h3>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{title}</p>
    {children}
  </div>
);

const EmptyChartState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-40 text-sm text-gray-400">{message}</div>
);

const SkeletonChart = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
    <div className="h-52 bg-gray-100 rounded" />
  </div>
);

const SkeletonKpi = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="border-l-2 pl-3 mb-3" style={{ borderColor: C_MUTED }}>
      <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
      <div className="h-8 w-20 bg-gray-100 rounded" />
    </div>
    <div className="h-3 w-24 bg-gray-100 rounded" />
  </div>
);

const PieLegend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
    {items.map(it => (
      <span key={it.label} className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: it.color }} />
        {it.label}
      </span>
    ))}
  </div>
);

const AdminAnalyticsPage: React.FC = () => {
  const [activeTab,   setActiveTab]   = useState<TabKey>("Overview");
  const [timeRange,   setTimeRange]   = useState<TimeRange>("Last 6 Months");

  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [appStats,    setAppStats]    = useState<AppStat[]>([]);
  const [revStats,    setRevStats]    = useState<RevStat[]>([]);
  const [projection,  setProjection]  = useState<MarketProjection | null>(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApp,   setLoadingApp]   = useState(true);
  const [loadingRev,   setLoadingRev]   = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    setLoadingStats(true);
    apiClient.get<{ data: { stats: DashboardStats } }>("/admin/dashboard")
      .then(res => setStats(res.data.data.stats))
      .catch(err => setError((err as { message?: string }).message ?? "Failed to load dashboard"))
      .finally(() => setLoadingStats(false));

    apiClient.get<{ data: MarketProjection }>("/admin/analytics/market-projection")
      .then(res => setProjection(res.data.data ?? null))
      .catch(() => setProjection(null));
  }, []);

  useEffect(() => {
    const q = periodParams(timeRange);

    setLoadingApp(true);
    apiClient.get<{ data: AppStat[] }>(`/admin/analytics/applications?${q}`)
      .then(res => setAppStats(res.data.data ?? []))
      .catch(() => setAppStats([]))
      .finally(() => setLoadingApp(false));

    setLoadingRev(true);
    apiClient.get<{ data: RevStat[] }>(`/admin/analytics/revenue?${q}`)
      .then(res => setRevStats(res.data.data ?? []))
      .catch(() => setRevStats([]))
      .finally(() => setLoadingRev(false));
  }, [timeRange]);

  const loading = loadingStats || loadingApp;

  const totalApps     = stats?.totalApplications ?? 0;
  const approvedLoans = stats?.approvedLoans ?? 0;
  const disbursedLoans= stats?.disbursedLoans ?? 0;

  const appTrend = (() => {
    if (appStats.length < 2) return null;
    const last  = appStats[appStats.length - 1].total;
    const prev  = appStats[appStats.length - 2].total;
    if (prev === 0) return null;
    const delta = ((last - prev) / prev) * 100;
    return delta;
  })();

  const latestPeriod = appStats.length > 0 ? appStats[appStats.length - 1] : null;

  const pieData = latestPeriod
    ? [
        { name: "Pending",   value: latestPeriod.pending,   color: C_AMBER  },
        { name: "Approved",  value: latestPeriod.approved,  color: C_SUCCESS },
        { name: "Rejected",  value: latestPeriod.rejected,  color: C_RED    },
        { name: "Disbursed", value: latestPeriod.disbursed, color: C_INFO   },
      ].filter(d => d.value > 0)
    : [];

  const totalRevenue     = revStats.reduce((s, r) => s + r.revenue, 0);
  const avgPerApp        = revStats.length > 0 && totalApps > 0
    ? totalRevenue / totalApps : 0;

  const tableRows = appStats.slice(-6);

  return (
    <div className="max-w-[1100px] mx-auto py-6 sm:py-8 space-y-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Platform intelligence for SkulCredit operations</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-1 overflow-x-auto">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab
                    ? "text-[#7A0E42] border-[#7A0E42]"
                    : "text-gray-500 border-transparent hover:text-gray-700",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 px-3 shrink-0">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setTimeRange(opt)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                  timeRange === opt
                    ? "text-white"
                    : "text-gray-500 hover:bg-gray-100",
                ].join(" ")}
                style={timeRange === opt ? { backgroundColor: C_PRIMARY } : {}}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <SkeletonKpi key={i} />)
            ) : (
              <>
                <KpiCard
                  label="Total Loan Applications"
                  value={fmtNum(totalApps)}
                  sub={appTrend !== null
                    ? `${appTrend >= 0 ? "▲" : "▼"} ${Math.abs(appTrend).toFixed(1)}% vs prev period`
                    : undefined}
                  accent={C_PRIMARY}
                />
                <KpiCard
                  label="Approval Rate"
                  value={pct(approvedLoans, totalApps)}
                  sub={`${fmtNum(approvedLoans)} approved of ${fmtNum(totalApps)}`}
                  accent={C_SUCCESS}
                />
                <KpiCard
                  label="Total Disbursed"
                  value={stats ? fmtNgn(stats.totalDisbursed) : "—"}
                  sub={`${fmtNum(disbursedLoans)} disbursed loans`}
                  accent={C_INFO}
                />
                <KpiCard
                  label="Service Charges Collected"
                  value={stats ? fmtNgn(stats.totalRevenue) : "—"}
                  accent={C_SECONDARY}
                />
              </>
            )}
          </div>

          {loadingApp ? (
            <SkeletonChart />
          ) : (
            <ChartCard title="Application Trend">
              {appStats.length === 0 ? (
                <EmptyChartState message="No application data for this period." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={appStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="approved"  name="Approved"  stroke={C_SUCCESS}   fill={C_SUCCESS}   fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="pending"   name="Pending"   stroke={C_AMBER}     fill={C_AMBER}     fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="rejected"  name="Rejected"  stroke={C_RED}       fill={C_RED}       fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke={C_INFO}      fill={C_INFO}      fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Market Projection</p>
            {projection === null ? (
              <div className="flex items-center justify-center h-24 text-sm text-gray-400">
                Market projection data is currently unavailable.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SmallStat
                  label="Projected Revenue"
                  value={projection.projectedRevenue != null ? fmtNgnFull(projection.projectedRevenue) : "—"}
                  color={C_PRIMARY}
                />
                <SmallStat
                  label="Projected Applications"
                  value={projection.projectedApplications != null ? fmtNum(projection.projectedApplications) : "—"}
                  color={C_INFO}
                />
                <SmallStat
                  label="Market Size"
                  value={projection.marketSize != null ? fmtNgnFull(projection.marketSize) : "—"}
                  color={C_SUCCESS}
                />
                <SmallStat
                  label="Penetration Rate"
                  value={projection.penetrationRate != null ? `${projection.penetrationRate.toFixed(2)}%` : "—"}
                  color={C_SECONDARY}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Loan Performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? (
              [1,2,3].map(i => <SkeletonKpi key={i} />)
            ) : (
              <>
                <SmallStat label="Approval Rate"     value={pct(approvedLoans, totalApps)} color={C_SUCCESS}   />
                <SmallStat label="Disbursement Rate" value={pct(disbursedLoans, totalApps)} color={C_INFO}     />
                <SmallStat label="Rejection Rate"    value={pct(stats?.pendingLoans === undefined ? 0 : totalApps - approvedLoans - disbursedLoans - (stats?.pendingLoans ?? 0), totalApps)} color={C_RED} />
              </>
            )}
          </div>

          {loadingApp ? (
            <SkeletonChart />
          ) : (
            <ChartCard title="Application Volume Over Time">
              {appStats.length === 0 ? (
                <EmptyChartState message="No data for this period." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={appStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="approved"  name="Approved"  stroke={C_SUCCESS} fill={C_SUCCESS} fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="pending"   name="Pending"   stroke={C_AMBER}   fill={C_AMBER}   fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="rejected"  name="Rejected"  stroke={C_RED}     fill={C_RED}     fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke={C_INFO}    fill={C_INFO}    fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          {loadingApp ? (
            <SkeletonChart />
          ) : (
            <ChartCard title="Monthly Disbursement Volume">
              {appStats.length === 0 ? (
                <EmptyChartState message="No disbursement data." />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={appStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="disbursed" name="Disbursed" fill={C_PRIMARY} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          {loadingApp ? (
            <SkeletonChart />
          ) : (
            <ChartCard title="Application Status Breakdown (Latest Period)">
              {pieData.length === 0 ? (
                <EmptyChartState message="No status breakdown available." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => fmtNum(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend items={pieData.map(d => ({ label: d.name, color: d.color }))} />
                </>
              )}
            </ChartCard>
          )}
        </div>
      )}

      {activeTab === "Revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loadingRev ? (
              [1,2,3].map(i => <SkeletonKpi key={i} />)
            ) : (
              <>
                <SmallStat label="Total Revenue"          value={fmtNgnFull(totalRevenue)}       color={C_PRIMARY}   />
                <SmallStat label="Avg Revenue / App"      value={fmtNgnFull(Math.round(avgPerApp))} color={C_SECONDARY} />
                <SmallStat label="Periods with Data"      value={fmtNum(revStats.length)}         color={C_INFO}      />
              </>
            )}
          </div>

          {loadingRev ? (
            <SkeletonChart />
          ) : revStats.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center text-sm text-gray-400">
              No revenue data available for the selected period.
            </div>
          ) : (
            <ChartCard title="Revenue Trend">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₦${(v / 1_000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => fmtNgnFull(val)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue"        name="Revenue"         stroke={C_PRIMARY}   strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="serviceCharges" name="Service Charges" stroke={C_SECONDARY} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {activeTab === "School & Parent Growth" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loadingStats ? (
              [1,2,3].map(i => <SkeletonKpi key={i} />)
            ) : (
              <>
                <SmallStat label="Total Schools"  value={fmtNum(stats?.totalSchools  ?? 0)} color={C_PRIMARY}   />
                <SmallStat label="Pending KYC"    value={fmtNum(stats?.pendingSchools ?? 0)} color={C_AMBER}     />
                <SmallStat label="Total Parents"  value={fmtNum(stats?.totalParents   ?? 0)} color={C_INFO}      />
              </>
            )}
          </div>

          {loadingApp ? (
            <SkeletonChart />
          ) : (
            <ChartCard title="Monthly Application Volume">
              {appStats.length === 0 ? (
                <EmptyChartState message="No application data for this period." />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={appStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Applications" fill={C_PRIMARY} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionTitle>Application Summary (Last 6 Periods)</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Period", "Total", "Approved", "Disbursed"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingApp ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        {[1,2,3,4].map(j => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${40 + j * 12}px` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">
                        No data for this period.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500 whitespace-nowrap">{row.period}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-900">{fmtNum(row.total)}</td>
                        <td className="px-5 py-3.5 text-green-600">{fmtNum(row.approved)}</td>
                        <td className="px-5 py-3.5 text-blue-600">{fmtNum(row.disbursed)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
