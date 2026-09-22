import React, { useState } from "react";
import { DashboardLayout, AdminSidebar } from "../../components/layout";
import AdminTopBar from "./components/AdminTopBar";
import Icon from "../../components/Icon";

interface School {
  initials: string;
  color: string;
  name: string;
  code: string;
  location: string;
  zone: string;
  enrolled: string;
  volume: string;
  accreditation: string;
  accreditationColor: string;
  bank: string;
  acctLast: string;
  drawdown: string;
  drawdownColor: string;
}

const SCHOOLS: School[] = [
  {
    initials: "GA", color: "bg-rose-100 text-rose-700",
    name: "Greenfield Academy", code: "SCH-042 · CAC-882910",
    location: "Lekki Phase 1, Lagos", zone: "South West Zone",
    enrolled: "142 students", volume: "₦46.2M active volume",
    accreditation: "Tier 1 (A+)", accreditationColor: "bg-green-100 text-green-700 border-green-200",
    bank: "Providus Bank", acctLast: "••••4910",
    drawdown: "Active / In-Cycle", drawdownColor: "text-green-600",
  },
  {
    initials: "SJ", color: "bg-blue-100 text-blue-700",
    name: "St. Jude High School", code: "SCH-089 · CAC-RC491029",
    location: "Garki Area 11, Abuja", zone: "North Central Zone",
    enrolled: "88 students", volume: "₦29.6M active volume",
    accreditation: "Tier 2 (A)", accreditationColor: "bg-blue-100 text-blue-700 border-blue-200",
    bank: "Zenith Bank", acctLast: "••••3821",
    drawdown: "Tranche 2 R…", drawdownColor: "text-blue-600",
  },
  {
    initials: "KI", color: "bg-amber-100 text-amber-700",
    name: "Kingsway International", code: "SCH-113 · CAC-PENDING",
    location: "Ikeja GRA, Lagos", zone: "South West Zone",
    enrolled: "210 registered", volume: "Tranches locked",
    accreditation: "Provisional Tier 3", accreditationColor: "bg-amber-100 text-amber-700 border-amber-200",
    bank: "Access Bank", acctLast: "••••1164",
    drawdown: "Hold Pendin…", drawdownColor: "text-red-500",
  },
  {
    initials: "CC", color: "bg-purple-100 text-purple-700",
    name: "Crown College Lagos", code: "SCH-105 · CAC-RC309182",
    location: "Victoria Island, Lagos", zone: "South West Zone",
    enrolled: "95 students", volume: "₦34.1M active volume",
    accreditation: "Tier 1 (A+)", accreditationColor: "bg-green-100 text-green-700 border-green-200",
    bank: "First Bank Nig", acctLast: "••••9012",
    drawdown: "Active / In-Cycle", drawdownColor: "text-green-600",
  },
  {
    initials: "RS", color: "bg-teal-100 text-teal-700",
    name: "Riverside Model School", code: "SCH-163 · CAC-RC671239",
    location: "Old GRA, Port Harcourt", zone: "Rivers State / South South",
    enrolled: "52 students", volume: "₦18.9M active volume",
    accreditation: "Tier 2 (A)", accreditationColor: "bg-blue-100 text-blue-700 border-blue-200",
    bank: "GTBank PLC", acctLast: "••••7741",
    drawdown: "Tranche 2 R…", drawdownColor: "text-blue-600",
  },
  {
    initials: "BA", color: "bg-indigo-100 text-indigo-700",
    name: "Bodija Premier College", code: "SCH-071 · CAC-RC512400",
    location: "Bodija, Ibadan", zone: "Oyo State / South West",
    enrolled: "64 students", volume: "₦21.4M active volume",
    accreditation: "Tier 1 (A+)", accreditationColor: "bg-green-100 text-green-700 border-green-200",
    bank: "UBA PLC", acctLast: "••••6190",
    drawdown: "Active / In-Cycle", drawdownColor: "text-green-600",
  },
];

type SchoolFilterTab = "All Institutions" | "Fully Verified" | "Pending Audit" | "Under Review";

const AdminSchoolsPage: React.FC = () => {
  const [tab, setTab] = useState<SchoolFilterTab>("All Institutions");
  const [showCompliance, setShowCompliance] = useState(true);

  return (
    <DashboardLayout sidebar={<AdminSidebar />} header={<AdminTopBar />}>
      <div className="max-w-[1280px] mx-auto py-8 px-2 space-y-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Partner Schools
              <span className="px-2.5 py-1 bg-[#881337]/10 text-[#881337] text-sm font-bold rounded-full">184 Institutions</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Institutional partner directory, verification statuses, accredited tuition tranches, and school bank settlement profiles.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Icon name="download" className="w-4 h-4" /> Export Partner Directory
            </button>
            <button className="flex items-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6f0e2c] transition-colors">
              <Icon name="plus" className="w-4 h-4" /> Onboard New School
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Partner Schools",   value: "184",      sub: "+6 Zones Across 6 regional education zones", icon: "building-2", color: "text-[#881337]" },
            { label: "Total Tuition Disbursed",  value: "₦312.4M",  sub: "+14.2% MoM Cumulative term portfolio settlement", icon: "trending-up", color: "text-green-600" },
            { label: "Verification Pending",     value: "5 Schools", sub: "Action req. Awaiting CAC / State MOE sign-off", icon: "shield-alert", color: "text-amber-500", highlight: true },
            { label: "Repayment Compliance",     value: "96.8%",    sub: "Tier A Target Institution rating benchmark standard", icon: "check-circle", color: "text-green-600" },
          ].map((k, i) => (
            <div key={i} className={`bg-white rounded-xl border p-5 ${k.highlight ? "border-amber-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-snug">{k.label}</p>
                <Icon name={k.icon} className={`w-4 h-4 shrink-0 ${k.color}`} />
              </div>
              <p className={`text-2xl font-bold ${k.highlight ? "text-amber-600" : "text-slate-900"}`}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{k.sub}</p>
              {i === 3 && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Tier A Target</span>
              )}
            </div>
          ))}
        </div>
        {showCompliance && (
          <div className="bg-white rounded-xl border border-amber-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Icon name="clipboard-list" className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">Institutional Compliance Queue</h3>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">5 Actions Pending</span>
                  </div>
                  <p className="text-sm text-slate-600 max-w-2xl">
                    Document accreditation requires manual compliance audit prior to initial tranche unlock: CAC certificate check, Ministry of Education operational approval, and 2-signature bank mandate confirmation.
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Icon name="file-check" className="w-3.5 h-3.5 text-green-500" /> CAC Status: 2/5</span>
                    <span className="flex items-center gap-1"><Icon name="file-text" className="w-3.5 h-3.5 text-amber-500" /> MOE License: 3/5</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCompliance(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
                <button className="flex items-center gap-1.5 bg-[#881337] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#6f0e2c] transition-colors">
                  Review Audit Queue <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1">
              {(["All Institutions", "Fully Verified", "Pending Audit", "Under Review"] as SchoolFilterTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === t ? "bg-[#881337]/10 text-[#881337]" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {t}
                  {t === "All Institutions" && " (184)"}
                  {t === "Fully Verified"   && " (168)"}
                  {t === "Pending Audit"    && " (5)"}
                  {t === "Under Review"     && " (11)"}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">
              Active Tranche Drawdown Cycle: <span className="font-semibold text-slate-700">2024/2025 Term 2</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
              <Icon name="search" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full" placeholder="Search by School Name, State, CAC Reg #, or Principal" />
            </div>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 outline-none">
              <option>All Regions (Lagos, Abuja, Rivers, Oyo, Enugu)</option>
            </select>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 outline-none">
              <option>All Tiers</option>
            </select>
            <button className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Icon name="x" className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["INSTITUTION NAME & CODE", "LOCATION / ZONE", "ENROLLED / VOLUME", "ACCREDITATION", "SETTLEMENT ACCOUNT", "DRAWDOWN STATUS"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SCHOOLS.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${row.color}`}>
                          {row.initials}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{row.name}</p>
                          <p className="text-xs text-slate-400">{row.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-800">{row.location}</p>
                      <p className="text-xs text-slate-400">{row.zone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{row.enrolled}</p>
                      <p className="text-xs text-[#881337] font-semibold">{row.volume}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${row.accreditationColor}`}>
                        {row.accreditation.includes("Tier 1") && <Icon name="check-circle" className="w-3 h-3" />}
                        {row.accreditation.includes("Tier 2") && <Icon name="check" className="w-3 h-3" />}
                        {row.accreditation.includes("Provisional") && <Icon name="alert-circle" className="w-3 h-3" />}
                        {row.accreditation}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700 font-medium">{row.bank}</p>
                      <p className="text-xs text-slate-400 font-mono">{row.acctLast}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${row.drawdownColor}`}>{row.drawdown}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Showing 1–6 of 184 institutions &nbsp; Rows per page: 10</span>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded border border-[#881337] bg-[#881337] text-white text-xs font-bold">1</button>
              {[2, 3, "…", 19].map((p, i) => (
                <button key={i} className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors">{p}</button>
              ))}
              <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                <Icon name="chevron-right" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Accreditation Distribution</h3>
              <button className="text-xs text-[#881337] font-semibold hover:underline">Criteria</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Tier matrix governing loan max tranches</p>
            <div className="space-y-4">
              {[
                { label: "Tier 1 (A+ Institutional)", count: "112 Schools (61%)", color: "bg-[#881337]", maxDis: "₦100M", rep: "98.4%", pct: 61 },
                { label: "Tier 2 (A Standard)",        count: "56 Schools (30%)", color: "bg-slate-400",  maxDis: "₦40M",  rep: "95.1%", pct: 30 },
                { label: "Tier 3 (B Provisional)",     count: "16 Schools (9%)",  color: "bg-red-400",   maxDis: "₦15M",  rep: "91.8%", pct: 9  },
              ].map((t) => (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${t.color} inline-block`} />
                      {t.label}
                    </span>
                    <span className="text-xs text-slate-500">{t.count}</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-[11px] text-slate-400">
                    <span>Max disbursement cap: {t.maxDis}</span>
                    <span>Repayment rate: {t.rep}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">Tier 1 institutions qualify for zero-wait automated bulk disbursements via NIBSS direct settlement rails.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900">Tuition Tranche Schedule</h3>
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full">Mid-Term Active</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">Current Term 2 release cycle breakdown</p>
            <div className="space-y-3">
              {[
                { tag: "T1", label: "Tranche 1 (Term Start)",  note: "40% Capital Outlay · Disbursed · Closed",  amount: "₦124.9M", pct: 100, color: "bg-green-500",   status: "Disbursed", statusColor: "text-green-600" },
                { tag: "T2", label: "Tranche 2 (Mid-Term)",    note: "40% Academic Progress · In Review",        amount: "₦118.2M", pct: 86,  color: "bg-[#881337]",  status: "86% Released", statusColor: "text-[#881337]" },
                { tag: "T3", label: "Tranche 3 (Term End)",    note: "20% Audit & Assessment · Queued",          amount: "₦69.3M",  pct: 0,   color: "bg-slate-200",  status: "Opens Mar 28", statusColor: "text-slate-400" },
              ].map((t) => (
                <div key={t.tag} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{t.tag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.note}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">{t.amount}</p>
                        <p className={`text-xs font-semibold ${t.statusColor}`}>{t.status}</p>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full bg-slate-100 mt-2">
                      <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-center text-xs text-[#881337] font-semibold hover:underline pt-3 border-t border-slate-100">
              View Tranche Configuration Matrix →
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="landmark" className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Settlement Profiles</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Direct tuition settlement rails require secondary administrative confirmation before banking profile changes are processed.</p>

            <div className="rounded-lg border border-slate-200 overflow-hidden mb-4">
              <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Onboarding</div>
              <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm shrink-0">SC</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">St. Claire British Academy</p>
                  <p className="text-xs text-slate-400">CAC Registered · Tier 1 Approved</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 mb-5">
              <div className="flex items-center gap-2">
                <Icon name="check" className="w-3.5 h-3.5 text-green-500" />
                <span>Active Disbursement Mandates &nbsp;184 Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="shield" className="w-3.5 h-3.5 text-amber-500" />
                <span>Dual Authorization Rule &nbsp; ENFORCED (2-Key)</span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#6f0e2c] transition-colors">
              <Icon name="landmark" className="w-4 h-4" /> Manage Bank Settlement Mandates
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminSchoolsPage;
