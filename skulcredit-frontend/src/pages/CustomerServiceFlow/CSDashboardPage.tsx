import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";

const BRAND = "#7A0E42";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedToday: number;
  escalated: number;
  totalIssuesChange: number;
  openIssuesChange: number;
  inProgressChange: number;
  resolvedTodayChange: number;
  escalatedChange: number;
}

interface IssueRow {
  id: string;
  ticketId: string;
  customerName: string;
  customerType: "parent" | "school";
  issueType: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "awaiting_customer" | "escalated" | "resolved" | "closed";
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  text: string;
  sub?: string;
  time: string;
  type: "update" | "escalate" | "resolve" | "message" | "close";
}

interface CategoryItem {
  label: string;
  pct: number;
  color: string;
}

const PRIORITY_CFG = {
  high:   { bg: "bg-red-100",    text: "text-red-600",    label: "High"   },
  medium: { bg: "bg-amber-100",  text: "text-amber-700",  label: "Medium" },
  low:    { bg: "bg-green-100",  text: "text-green-700",  label: "Low"    },
};

const STATUS_CFG = {
  open:              { bg: "bg-amber-100",  text: "text-amber-700",  label: "Open"              },
  in_progress:       { bg: "bg-blue-100",   text: "text-blue-700",   label: "In Progress"       },
  awaiting_customer: { bg: "bg-purple-100", text: "text-purple-700", label: "Awaiting Customer" },
  escalated:         { bg: "bg-red-100",    text: "text-red-600",    label: "Escalated"         },
  resolved:          { bg: "bg-green-100",  text: "text-green-700",  label: "Resolved"          },
  closed:            { bg: "bg-gray-100",   text: "text-gray-600",   label: "Closed"            },
};

const CATEGORIES: CategoryItem[] = [
  { label: "Loan Application", pct: 22, color: "#e11d48" },
  { label: "Payment",          pct: 18, color: "#f59e0b" },
  { label: "Technical Issue",  pct: 16, color: "#f97316" },
  { label: "Document Upload",  pct: 12, color: "#8b5cf6" },
  { label: "General Inquiry",  pct: 12, color: "#0ea5e9" },
  { label: "Others",           pct: 20, color: "#22c55e" },
];

const CHART_POINTS = [12, 18, 14, 22, 20, 28, 38];
const CHART_DAYS   = ["Oct 1","Oct 2","Oct 3","Oct 4","Oct 5","Oct 6","Oct 7"];

function buildSparklinePath(pts: number[], w: number, h: number, pad = 8): string {
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const xStep = (w - pad * 2) / (pts.length - 1);
  return pts
    .map((p, i) => {
      const x = pad + i * xStep;
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  change: number;
  loading: boolean;
}> = ({ icon, iconBg, label, value, change, loading }) => {
  const up = change >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium leading-tight">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      )}
      <div className="flex items-center gap-1 text-xs">
        <span className={up ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
          {up ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-gray-400">vs. last 7 days</span>
      </div>
    </div>
  );
};

const DonutChart: React.FC<{ total: number; categories: CategoryItem[] }> = ({ total, categories }) => {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: 180, height: 180 }}>
          <svg width={180} height={180} viewBox="0 0 180 180" aria-hidden="true">
            {categories.map((cat, i) => {
              const dashLen = (cat.pct / 100) * circumference;
              const offset  = circumference - cumulative * circumference / 100;
              cumulative += cat.pct;
              return (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="22"
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              );
            })}
            <circle cx={cx} cy={cy} r={r - 14} fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-[10px] text-gray-400 font-medium">Total Issues</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-gray-600 truncate">{cat.label}</span>
            </div>
            <span className="text-gray-500 font-medium shrink-0">{cat.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CSDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [issues,  setIssues]  = useState<IssueRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, issuesRes] = await Promise.allSettled([
          apiClient.get<{ data: DashboardStats }>("/cs/dashboard"),
          apiClient.get<{ data: { total: number; page: number; limit: number; data: IssueRow[] } }>("/cs/tickets?limit=5"),
        ]);

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data.data);
        } else {
          setStats({
            totalIssues: 0, openIssues: 0, inProgressIssues: 0,
            resolvedToday: 0, escalated: 0,
            totalIssuesChange: 0, openIssuesChange: 0, inProgressChange: 0,
            resolvedTodayChange: 0, escalatedChange: 0,
          });
        }

        if (issuesRes.status === "fulfilled") {
          setIssues(issuesRes.value.data.data.data ?? []);
        } else {
          setIssues([]);
        }

        setActivity([
          { id: "a1", text: "Issue #SC-1024 updated to In Progress", sub: "by You",                time: "10:24 AM", type: "update"   },
          { id: "a2", text: "Issue #SC-1023 escalated to Level 2",   sub: "by You",                time: "09:00 AM", type: "escalate" },
          { id: "a3", text: "Issue #SC-1022 resolved",               sub: "by Amira Bello",        time: "08:47 AM", type: "resolve"  },
          { id: "a4", text: "New message from Tunde Adebayo",        sub: '"Please help with my payment issue..."', time: "08:12 AM", type: "message" },
          { id: "a5", text: "Issue #SC-1019 closed",                 sub: "by Chinnedu Okafor",   time: "Yesterday", type: "close"  },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const s = stats;

  const activityIcon = (type: ActivityItem["type"]) => {
    const map = {
      update:   { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", bg: "bg-blue-100 text-blue-600" },
      escalate: { d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", bg: "bg-amber-100 text-amber-600" },
      resolve:  { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3", bg: "bg-green-100 text-green-600" },
      message:  { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", bg: "bg-purple-100 text-purple-600" },
      close:    { d: "M18 6 6 18M6 6l12 12", bg: "bg-gray-100 text-gray-500" },
    };
    const cfg = map[type];
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Ic d={cfg.d} cls="w-3.5 h-3.5" />
      </div>
    );
  };

  const chartW = 280;
  const chartH = 100;
  const linePath = buildSparklinePath(CHART_POINTS, chartW, chartH);

  return (
    <div className="pt-6 pb-12 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span style={{ color: BRAND }}>Customer Service</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your support today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 shrink-0">
          <Ic d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" cls="w-4 h-4 text-gray-400" />
          {todayLabel()}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" cls="w-4 h-4 text-pink-600" />}
          iconBg="bg-pink-100"
          label="Total Issues"
          value={s?.totalIssues ?? 0}
          change={s?.totalIssuesChange ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Ic d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zM12 8v4l3 3" cls="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Open Issues"
          value={s?.openIssues ?? 0}
          change={s?.openIssuesChange ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Ic d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" cls="w-4 h-4 text-amber-600" />}
          iconBg="bg-amber-100"
          label="In Progress"
          value={s?.inProgressIssues ?? 0}
          change={s?.inProgressChange ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Ic d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" cls="w-4 h-4 text-green-600" />}
          iconBg="bg-green-100"
          label="Resolved Today"
          value={s?.resolvedToday ?? 0}
          change={s?.resolvedTodayChange ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Ic d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" cls="w-4 h-4 text-red-600" />}
          iconBg="bg-red-100"
          label="Escalated"
          value={s?.escalated ?? 0}
          change={s?.escalatedChange ?? 0}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Issues Overview</h3>
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1">Last 7 days ▾</span>
            </div>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 100 }} aria-label="Issues trend chart">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={BRAND} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path
                d={`${linePath} L${(chartW - 8).toFixed(1)},${chartH - 8} L8,${chartH - 8} Z`}
                fill="url(#chartGrad)"
              />
              <path d={linePath} stroke={BRAND} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {CHART_POINTS.map((p, i) => {
                const min   = Math.min(...CHART_POINTS);
                const max   = Math.max(...CHART_POINTS);
                const range = max - min || 1;
                const xStep = (chartW - 16) / (CHART_POINTS.length - 1);
                const x = 8 + i * xStep;
                const y = chartH - 8 - ((p - min) / range) * (chartH - 16);
                return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={BRAND} strokeWidth="2" />;
              })}
            </svg>
            <div className="flex justify-between mt-2">
              {CHART_DAYS.map((d) => (
                <span key={d} className="text-[9px] text-gray-400">{d}</span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Issues by Category</h3>
            <DonutChart total={s?.totalIssues ?? 48} categories={CATEGORIES} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-gray-800">Quick Actions</h3>
          {[
            { icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", label: "View Escalated Tickets", sub: "Review escalated issues", path: "/cs/issues?status=escalated" },
            { icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",    label: "Escalate Issue",    sub: "Send to higher support level", path: "/cs/issues?action=escalate" },
            { icon: "M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", label: "View All Issues", sub: "Browse and manage tickets", path: "/cs/issues" },
            { icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", label: "Search Customer", sub: "Find parent, school or application", path: "/cs/parents" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style={{ backgroundColor: "rgba(122,14,66,0.08)" }}>
                <Ic d={action.icon} cls="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{action.sub}</p>
              </div>
              <Ic d="M9 18l6-6-6-6" cls="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Recent Issues</h3>
            <button
              onClick={() => navigate("/cs/issues")}
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: BRAND }}
            >
              View All Issues
              <Ic d="M5 12h14M12 5l7 7-7 7" cls="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Ticket ID", "Customer", "Issue Type", "Priority", "Status", "Updated", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : issues.map((row) => {
                  const pri = PRIORITY_CFG[row.priority] ?? PRIORITY_CFG.medium;
                  const sta = STATUS_CFG[row.status]     ?? STATUS_CFG.open;
                  return (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">#{row.ticketId}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{row.customerName}</p>
                        <p className="text-[11px] text-gray-400 capitalize">{row.customerType}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.issueType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${pri.bg} ${pri.text}`}>
                          {pri.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${sta.bg} ${sta.text}`}>
                          {sta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(row.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/cs/issues/${row.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                            style={{ backgroundColor: BRAND }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}
                          >
                            View
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Ic d="M12 5v.01M12 12v.01M12 19v.01" cls="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Recent Activity</h3>
            <button className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
              View All →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {activityIcon(a.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{a.text}</p>
                  {a.sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{a.sub}</p>}
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z", label: "Need Help?",       sub: "Contact support for urgent issues.",   path: "/cs/escalations" },
          { icon: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",                                                              label: "Knowledge Base",  sub: "Find answers to common questions.",   path: "/cs/knowledge"   },
          { icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.09 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z", label: "Support Hotline", sub: "+234 800 123 4567",                path: "/cs/issues"      },
          { icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",                                                          label: "Email Support",   sub: "support@skulcredit.com",              path: "/cs/issues"      },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3 hover:border-gray-200 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ backgroundColor: "rgba(122,14,66,0.08)" }}>
              <Ic d={item.icon} cls="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CSDashboardPage;
