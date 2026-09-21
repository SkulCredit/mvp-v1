import React, { useState } from "react";
import { DashboardLayout, AdminSidebar } from "../../components/layout";
import AdminTopBar from "./components/AdminTopBar";
import Icon from "../../components/Icon";

const DisbursementChart: React.FC = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const actual  = [72, 85, 78, 90, 82, 95];
  const target  = [80, 80, 85, 85, 88, 88];
  const maxVal  = 100;
  const barW    = 18;
  const gap     = 60;
  const chartH  = 160;
  const padL    = 8;
  const padB    = 24;

  return (
    <svg viewBox={`0 0 ${padL + months.length * gap} ${chartH + padB}`} className="w-full h-auto">
      {/* grid */}
      {[25, 50, 75, 100].map((v) => {
        const y = chartH - (v / maxVal) * chartH;
        return (
          <line key={v} x1={padL} x2={padL + months.length * gap - 10}
            y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
        );
      })}

      {months.map((m, i) => {
        const cx = padL + i * gap + gap / 2;
        const aH = (actual[i] / maxVal) * chartH;
        const tH = (target[i] / maxVal) * chartH;
        return (
          <g key={m}>
            {/* target bar */}
            <rect
              x={cx - barW / 2 - 1} y={chartH - tH}
              width={barW} height={tH}
              rx="3" fill="#e2e8f0"
            />
            {/* actual bar */}
            <rect
              x={cx + 2} y={chartH - aH}
              width={barW} height={aH}
              rx="3" fill="#881337"
            />
            {/* label */}
            <text x={cx + 1} y={chartH + padB - 6} textAnchor="middle" fontSize="11" fill="#94a3b8">{m}</text>
          </g>
        );
      })}
    </svg>
  );
};

const EXCEPTION_QUEUE = [
  { id: "SC-10482", name: "Sarah Johnson",  school: "Greenfield Academy",    amount: "₦850,000",   aging: "2h 14m",  sla: true,  risk: "Medium",   riskColor: "bg-amber-100 text-amber-700",  highlighted: true  },
  { id: "SC-10483", name: "David Adeleke",  school: "Crown College Lagos",   amount: "₦1,200,000", aging: "1h 10m",  sla: false, risk: "Low Risk", riskColor: "bg-green-100 text-green-700",  highlighted: false },
  { id: "SC-10484", name: "Kemi Balogun",   school: "Kingsway International", amount: "₦450,000",  aging: "45m",     sla: false, risk: "Low Risk", riskColor: "bg-green-100 text-green-700",  highlighted: false },
];

const AdminApplicationsPage: React.FC = () => {
  const [inspecting, setInspecting] = useState<string | null>("SC-10482");

  return (
    <DashboardLayout sidebar={<AdminSidebar />} header={<AdminTopBar />}>
      <div className="max-w-[1280px] mx-auto py-8 px-2 space-y-8">
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Credit Operations &rsaquo; <span className="text-slate-600">Administrative Command</span>
          </p>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Daily Operations Cockpit</h1>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">
                <Icon name="refresh-cw" className="w-3 h-3" />
                AUTOREFRESH 10s
              </div>
              <button className="flex items-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6f0e2c] transition-colors">
                <Icon name="download" className="w-4 h-4" /> Portfolio Export
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Active Exposure",
              value: "₦412,850,000",
              sub: "+14.8% vs last month",
              positive: true,
              icon: "landmark",
            },
            {
              label: "Action Required Queue",
              value: "18 Files",
              sub: "4 files exceed 2h SLA",
              positive: false,
              icon: "alert-circle",
              subColor: "text-red-500",
            },
            {
              label: "Collections Rate (M-T-D)",
              value: "97.4%",
              sub: "+0.8% benchmark",
              positive: true,
              icon: "settings",
            },
            {
              label: "Partner Institutions",
              value: "142 Schools",
              sub: "8 onboarding verifications",
              positive: true,
              icon: "building-2",
            },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-snug">{k.label}</p>
                <Icon name={k.icon} className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
              <p className={`text-2xl font-bold ${i === 1 ? "text-slate-900" : "text-slate-900"}`}>{k.value}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${k.subColor ?? (k.positive ? "text-green-600" : "text-red-500")}`}>
                {!k.subColor && <Icon name={k.positive ? "arrow-up" : "arrow-down"} className="w-3 h-3" />}
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="font-semibold text-slate-900">Disbursement vs Target Velocity</h2>
                <p className="text-xs text-slate-400 mt-0.5">Current Term Loan Drawdowns across top 10 regional clusters</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-[#881337] inline-block" /> Actual (₦)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-slate-200 inline-block" /> Target (₦)</span>
              </div>
            </div>
            <div className="mt-4">
              <DisbursementChart />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">Institutional Tier Risk</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-5">Partner school portfolio grade</p>

            <div className="space-y-4">
              {[
                { label: "Tier 1 (Anchor Schools)",       pct: 68, color: "bg-green-500",  track: "bg-green-100" },
                { label: "Tier 2 (Accredited Growth)",    pct: 24, color: "bg-slate-400",  track: "bg-slate-100" },
                { label: "Tier 3 (Provisional Watch)",    pct: 8,  color: "bg-red-500",    track: "bg-red-100"   },
              ].map((t) => (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700">{t.label}</span>
                    <span className="text-sm font-bold text-slate-900">{t.pct}%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${t.track}`}>
                    <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-500">Weighted Portfolio Rating</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">A- SECURED</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900">Operational Exception Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pending manual underwrite decisions and credit verification escalations</p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
              <Icon name="clock" className="w-3.5 h-3.5" /> 18 Pending Files
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["APPLICATION ID", "BENEFICIARY NAME", "SCHOOL AFFILIATION", "AMOUNT", "AGING", "RISK TIER", "ACTION"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EXCEPTION_QUEUE.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${row.highlighted ? "bg-rose-50/40" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[#881337]">{row.id}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">{row.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{row.school}</td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-900">{row.amount}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {row.sla ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                          {row.aging} (SLA Breach)
                        </span>
                      ) : (
                        <span className="text-slate-600">{row.aging}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.riskColor}`}>{row.risk}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {row.id === inspecting ? (
                        <button
                          onClick={() => setInspecting(null)}
                          className="px-3 py-1.5 bg-[#881337] text-white text-xs font-semibold rounded-lg hover:bg-[#6f0e2c] transition-colors"
                        >
                          Inspecting
                        </button>
                      ) : (
                        <button
                          onClick={() => setInspecting(row.id)}
                          className="text-xs font-semibold text-[#881337] hover:underline"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminApplicationsPage;
