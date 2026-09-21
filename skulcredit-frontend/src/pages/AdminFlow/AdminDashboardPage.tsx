import React, { useState } from "react";
import { DashboardLayout, AdminSidebar } from "../../components/layout";
import AdminTopBar from "./components/AdminTopBar";
import Icon from "../../components/Icon";

const MiniChart: React.FC<{ positive?: boolean }> = ({ positive = true }) => {
  const points = positive
    ? "0,18 10,14 20,16 30,10 40,12 50,6 60,4"
    : "0,4 10,8 20,6 30,12 40,10 50,14 60,18";
  const color = positive ? "#16a34a" : "#dc2626";
  return (
    <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const PortfolioChart: React.FC = () => {
  const width = 460;
  const height = 160;
  const pad = { l: 10, r: 10, t: 10, b: 10 };

  const pts = (ys: number[]) => {
    const n = ys.length;
    return ys
      .map((y, i) => {
        const x = pad.l + (i / (n - 1)) * (width - pad.l - pad.r);
        const yy = pad.t + (1 - y) * (height - pad.t - pad.b);
        return `${x},${yy}`;
      })
      .join(" ");
  };

  const disbursed = [0.05, 0.1, 0.18, 0.28, 0.42, 0.55, 0.68, 0.78, 0.88, 0.95];
  const repaid = [0.04, 0.08, 0.13, 0.2, 0.3, 0.4, 0.5, 0.6, 0.69, 0.76];
  const outstanding = [
    0.01, 0.02, 0.05, 0.08, 0.12, 0.15, 0.18, 0.18, 0.19, 0.19,
  ];

  const areaPath = (ys: number[]) => {
    const n = ys.length;
    const moves = ys
      .map((y, i) => {
        const x = pad.l + (i / (n - 1)) * (width - pad.l - pad.r);
        const yy = pad.t + (1 - y) * (height - pad.t - pad.b);
        return `${i === 0 ? "M" : "L"}${x},${yy}`;
      })
      .join(" ");
    const lastX = pad.l + width - pad.l - pad.r;
    const bottom = pad.t + (height - pad.t - pad.b);
    return `${moves} L${lastX},${bottom} L${pad.l},${bottom} Z`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="gDis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#881337" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#881337" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map((v, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={width - pad.r}
          y1={pad.t + (1 - v) * (height - pad.t - pad.b)}
          y2={pad.t + (1 - v) * (height - pad.t - pad.b)}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}
      {/* areas */}
      <path d={areaPath(disbursed)} fill="url(#gDis)" />
      <path d={areaPath(repaid)} fill="url(#gRep)" />
      {/* lines */}
      <polyline
        points={pts(disbursed)}
        stroke="#881337"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={pts(repaid)}
        stroke="#0ea5e9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={pts(outstanding)}
        stroke="#f59e0b"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
      />
    </svg>
  );
};

const ACTION_ITEMS = [
  {
    type: "Application Review",
    typeColor: "text-[#881337] bg-rose-50",
    item: "SC-10482 requires underwriting review",
    sub: "Lagos State Model College • Student: Chisom O.",
    age: "2h",
    priority: "High",
    priorityColor: "bg-red-100 text-red-600",
    status: "Pending",
    statusColor: "bg-slate-100 text-slate-600",
    action: "Review",
  },
  {
    type: "School Verification",
    typeColor: "text-amber-700 bg-amber-50",
    item: "Greenfield Academy verification pending",
    sub: "CAC accreditation document awaiting sign-off",
    age: "5h",
    priority: "Medium",
    priorityColor: "bg-amber-100 text-amber-600",
    status: "Pending",
    statusColor: "bg-slate-100 text-slate-600",
    action: "Review",
  },
  {
    type: "Failed Disbursement",
    typeColor: "text-red-700 bg-red-50",
    item: "Disbursement #DS-4832 failed",
    sub: "NIBSS response: invalid destination account number",
    age: "1d",
    priority: "Critical",
    priorityColor: "bg-red-100 text-red-700",
    status: "Exception",
    statusColor: "bg-red-50 text-red-600",
    action: "Resolve",
  },
  {
    type: "Repayment Exception",
    typeColor: "text-blue-700 bg-blue-50",
    item: "Account #SC-3942 has an overdue repayment",
    sub: "2nd mandate trigger missed (3 days grace expired)",
    age: "2d",
    priority: "Medium",
    priorityColor: "bg-amber-100 text-amber-600",
    status: "Attention",
    statusColor: "bg-amber-50 text-amber-600",
    action: "View",
  },
  {
    type: "Compliance Flag",
    typeColor: "text-purple-700 bg-purple-50",
    item: "Identity verification requires manual review",
    sub: "BVN name mismatch tolerance threshold exceeded (92%)",
    age: "3d",
    priority: "High",
    priorityColor: "bg-red-100 text-red-600",
    status: "Flagged",
    statusColor: "bg-purple-50 text-purple-600",
    action: "Review",
  },
];

const RECENT_ACTIVITY = [
  {
    dot: "bg-[#881337]",
    title: "Application approved",
    detail: "SC-10479 approved by Risk Officer",
    sub: "Student tuition tranche unlocked for direct school payout",
    time: "12 min ago",
  },
  {
    dot: "bg-[#881337]",
    title: "School verification completed",
    detail: "St. Jude High School accredited",
    sub: "Onboarding review cleared by compliance desk",
    time: "45 min ago",
  },
  {
    dot: "bg-[#881337]",
    title: "Disbursement processed",
    detail: "₦1.2M tranche released to Heritage College",
    sub: "Automated bulk transfer completed via payment gateway",
    time: "1h ago",
  },
  {
    dot: "bg-slate-300",
    title: "Compliance review completed",
    detail: "KYC Tier 3 verified for applicant SC-10471",
    sub: "Physical utility bill cross-referenced with national database",
    time: "2h ago",
  },
  {
    dot: "bg-slate-300",
    title: "Admin permission updated",
    detail: "User 'David K.' granted Underwriter role",
    sub: "Authorized by System Admin Alex Morgan",
    time: "3h ago",
  },
];

const AdminDashboardPage: React.FC = () => {
  const [chartRange, setChartRange] = useState<
    "7D" | "30D" | "3M" | "6M" | "12M"
  >("30D");

  return (
    <DashboardLayout sidebar={<AdminSidebar />} header={<AdminTopBar />}>
      <div className="max-w-[1280px] mx-auto py-8 px-2 space-y-8">
        {/* page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Good morning, Alex. Here's what needs your attention today.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="clock" className="w-3.5 h-3.5" /> Updated 2 min ago
            </span>
            <button className="flex items-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6f0e2c] transition-colors">
              <Icon name="download" className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Applications",
              value: "12,480",
              change: "+8.4%",
              positive: true,
              icon: "file-text",
            },
            {
              label: "Active Portfolio",
              value: "₦184.6M",
              change: "+5.2%",
              positive: true,
              icon: "briefcase",
            },
            {
              label: "Repayment Rate",
              value: "91.8%",
              change: "+2.1%",
              positive: true,
              icon: "check-circle",
            },
            {
              label: "Delinquency Rate",
              value: "4.7%",
              change: "-0.8%",
              positive: false,
              icon: "alert-triangle",
            },
          ].map((k, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {k.label}
                </p>
                <Icon name={k.icon} className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <div className="flex items-center justify-between mt-3">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${k.positive ? "text-green-600" : "text-red-600"}`}
                >
                  <Icon
                    name={k.positive ? "arrow-up" : "arrow-down"}
                    className="w-3 h-3"
                  />
                  {k.change}
                </span>
                <span className="text-xs text-slate-400">vs last month</span>
              </div>
              <div className="mt-2">
                <MiniChart positive={k.positive} />
              </div>
            </div>
          ))}
        </div>

        {/* chart + quick summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Portfolio Overview
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Capital performance and return cadence
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                {(["7D", "30D", "3M", "6M", "12M"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${chartRange === r ? "bg-[#881337] text-white" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <PortfolioChart />
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
              {[
                { label: "Disbursed ₦142.0M", color: "bg-[#881337]" },
                { label: "Repaid ₦118.4M", color: "bg-sky-500" },
                { label: "Outstanding ₦23.6M", color: "bg-amber-400" },
              ].map((l, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <span
                    className={`w-3 h-0.5 ${l.color} rounded-full inline-block`}
                  />
                  {l.label}
                </span>
              ))}
              <span className="ml-auto text-xs text-slate-400">
                30 days aggregate
              </span>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">Quick Summary</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Today's operational pulse
                </p>
              </div>
              <Icon name="zap" className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: "send",
                  label: "Disbursements",
                  detail: "Batch cycle running",
                  value: "₦8.4M",
                  badge: "42 trans.",
                  badgeColor: "bg-slate-100 text-slate-600",
                },
                {
                  icon: "refresh-cw",
                  label: "Repayments",
                  detail: "Settled via Direct Debit",
                  value: "₦5.9M",
                  badge: "118 incoming",
                  badgeColor: "bg-green-100 text-green-700",
                },
                {
                  icon: "file-text",
                  label: "Applications",
                  detail: "Term intake pipeline",
                  value: "286",
                  badge: "+12% today",
                  badgeColor: "bg-blue-100 text-blue-700",
                },
                {
                  icon: "clock",
                  label: "Pending Reviews",
                  detail: "Underwriter assignment",
                  value: "42",
                  badge: "Action queue",
                  badgeColor: "bg-amber-100 text-amber-700",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon name={item.icon} className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      {item.value}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Auto-sync connected
              </span>
              <button className="text-xs text-[#881337] font-semibold hover:underline">
                Configure thresholds
              </button>
            </div>
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900">Action required</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Items requiring manual authorization or operational
                intervention.
              </p>
            </div>
            <button className="text-xs text-[#881337] font-semibold hover:underline flex items-center gap-1">
              View all (14) <Icon name="arrow-right" className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["TYPE", "ITEM", "AGE", "PRIORITY", "STATUS", "ACTION"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACTION_ITEMS.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${row.typeColor}`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 text-sm">
                        {row.item}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{row.sub}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {row.age}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${row.priorityColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.statusColor}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${row.action === "Resolve" ? "bg-[#881337] text-white hover:bg-[#6f0e2c]" : "text-[#881337] hover:bg-rose-50"}`}
                      >
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Icon name="activity" className="w-4 h-4 text-slate-400" />
              Recent activity
            </h2>
            <button className="text-xs text-[#881337] font-semibold hover:underline">
              Live audit trail
            </button>
          </div>
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex gap-4 pb-4 last:pb-0">
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 ${item.dot}`}
                  />
                  {i < RECENT_ACTIVITY.length - 1 && (
                    <span className="w-px flex-1 bg-slate-100 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title} —{" "}
                        <span className="text-[#881337]">{item.detail}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
