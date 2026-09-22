import React, { useState } from "react";
import { DashboardLayout, AdminSidebar } from "../../components/layout";
import AdminTopBar from "./components/AdminTopBar";
import Icon from "../../components/Icon";

type BatchStatus = "Queued" | "Completed" | "Processing" | "Exception";

interface Batch {
  id: string;
  ref: string;
  initials: string;
  school: string;
  location: string;
  tranche: string;
  students: number;
  channel: string;
  channelSub: string;
  scheduled: string;
  status: BatchStatus;
  action: string;
  actionStyle: "outline" | "solid" | "link";
  exceptionCount?: number;
}

const BATCHES: Batch[] = [
  {
    id: "BATCH-2024-GA",    ref: "TRN-99824-NO", initials: "GA", school: "Greenfield Academy",      location: "Lekki Phase 1, Lagos",
    tranche: "₦4,850,000 Tranche 1/3 (Term 1)", students: 6,  channel: "NIBSS e-Tranzact",  channelSub: "",
    scheduled: "Today, 10:30 AM Queue: 12m remaining", status: "Queued",     action: "Authorize Release", actionStyle: "outline",
  },
  {
    id: "BATCH-2024-097",   ref: "TRN-99820-NO", initials: "SJ", school: "St. Jude High School",    location: "Ikeja GRA, Lagos",
    tranche: "₦6,200,000 Full Term Liquidation",        students: 8,  channel: "Providus AutoPay",   channelSub: "",
    scheduled: "Today, 09:15 AM Settlement Confirmed",  status: "Completed",  action: "Audit Trail",       actionStyle: "link",
  },
  {
    id: "BATCH-2024-CC",    ref: "TRN-99815-NO", initials: "CC", school: "Crown College Lagos",      location: "Victoria Island",
    tranche: "₦3,100,000 Tranche 2/3",                  students: 4,  channel: "Flutterwave Direct", channelSub: "Switch In-Flight",
    scheduled: "Today, 10:10 AM",                        status: "Processing", action: "Track Session",     actionStyle: "outline",
  },
  {
    id: "BATCH-2024-095",   ref: "TRN-99801-NO", initials: "AH", school: "Apex Heights College",     location: "Yaba Technical Park",
    tranche: "₦1,850,000 Destination Rejected",         students: 3,  channel: "NIBSS e-Tranzact",   channelSub: "",
    scheduled: "Today, 08:45 AM Failed at Gateway",     status: "Exception",  action: "Resolve Now",       actionStyle: "solid", exceptionCount: 3,
  },
  {
    id: "BATCH-2024-KS",    ref: "TRN-99789-NO", initials: "KS", school: "Kingsway Secondary School", location: "Surulere, Lagos",
    tranche: "₦5,350,000 Tranche 1/2",                  students: 7,  channel: "Providus AutoPay",   channelSub: "",
    scheduled: "Today, 06:20 AM Settlement Confirmed",  status: "Completed",  action: "Audit Trail",       actionStyle: "link",
  },
];

const EXCEPTIONS = [
  {
    id: "#DS-4832", school: "Apex Heights College",
    desc: "Invalid destination account (ERR-NIBSS-53)",
    detail: "Amount: ₦750,000 (Student: T. Adebimpe; Account: SC-9011)",
    cta1: "Update Account", cta2: "Dismiss",
  },
  {
    id: "#DS-4839", school: "Crown College Lagos",
    desc: "Name mismatch threshold > 15%",
    detail: "Amount: ₦600,000 (School portal name conflict)",
    cta1: "Manual Clear", cta2: "View Docs",
  },
  {
    id: "#DS-4841", school: "Greenwood Secondary",
    desc: "Provider gateway timeout (Switch Dropped)",
    detail: "Amount: ₦500,000 (Channel: Flutterwave Switch 2)",
    cta1: "Re-route via Providus", cta2: "Retry Gateway", solid: true,
  },
];

const RAILS = [
  { name: "NIBSS Instant Payment (NIP)",        sub: "Primary Interbank Switch",              latency: "45ms",  status: "Online",   statusColor: "text-green-600 bg-green-50" },
  { name: "Providus Virtual Accounts",           sub: "Dedicated Tranche Liquidation Rail",   latency: "38ms",  status: "Online",   statusColor: "text-green-600 bg-green-50" },
  { name: "Remita Debit / Tranche",             sub: "Federal / State School Gateway",        latency: "310ms", status: "Degraded", statusColor: "text-red-600 bg-red-50" },
];

const STATUS_COLORS: Record<BatchStatus, string> = {
  Queued:     "bg-slate-100 text-slate-600",
  Completed:  "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Exception:  "bg-red-100 text-red-700",
};

type FilterTab = "All Batches" | "Queued" | "Processing" | "Completed";

const AdminDisbursementsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterTab>("All Batches");

  const visible = filter === "All Batches"
    ? BATCHES
    : BATCHES.filter((b) => b.status === filter);

  return (
    <DashboardLayout sidebar={<AdminSidebar />} header={<AdminTopBar />}>
      <div className="max-w-[1280px] mx-auto py-8 px-2 space-y-8">
        <div>
          <p className="text-xs text-slate-400 mb-1">Operations &rsaquo; <span className="text-slate-600">Disbursements</span></p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Disbursements</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage tuition tranche drawdowns, batch payout queues, and bank gateway settlement exceptions.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Icon name="download" className="w-4 h-4" /> Export CSV
              </button>
              <button className="flex items-center gap-2 bg-[#881337] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#6f0e2c] transition-colors">
                <Icon name="zap" className="w-4 h-4" /> Process Batch Payout
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ready For Disbursement",  value: "₦34,250,000", sub: "28 applications queued for payout",     icon: "inbox",          color: "text-[#881337]" },
            { label: "Processed Today",          value: "₦18,400,000", sub: "14 tranches settled to schools",        icon: "check-circle",   color: "text-green-600" },
            { label: "Failed / Retried",         value: "₦1,850,000",  sub: "3 transactions require immediate review", icon: "alert-circle", color: "text-red-500" },
            { label: "Gateway Inflow Balance",   value: "₦52,800,000", sub: "99.8% uptime – NIBSS Connected",        icon: "cpu",            color: "text-blue-600" },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-snug">{k.label}</p>
                <Icon name={k.icon} className={`w-4 h-4 shrink-0 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-400 mt-2">{k.sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1">
              {(["All Batches", "Queued", "Processing", "Completed"] as FilterTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === t ? "bg-[#881337] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t}{t === "All Batches" ? " 45" : t === "Queued" ? " 12" : t === "Processing" ? " 4" : ""}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Icon name="search" className="w-3.5 h-3.5 text-slate-400" />
                <input className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-40" placeholder="Search Batch ID, school, applicant" />
              </div>
              <button className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Icon name="calendar" className="w-3.5 h-3.5" /> Last 7 Days
              </button>
              <button className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                All Partner Banks
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Icon name="sliders-horizontal" className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/60 border-b border-slate-100">
            <span className="text-xs text-slate-500">Showing 5 of 45 active batch runs &nbsp;|&nbsp; Tranche Volume: ₦21,350,000</span>
            <button className="text-xs text-[#881337] font-semibold hover:underline">Select All Filtered · Batch Schedule Rules</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                  {["BATCH / REF ID", "BENEFICIARY SCHOOL", "TOTAL TRANCHE", "STUDENTS", "PAYMENT CHANNEL", "SCHEDULED / EXEC.", "STATUS", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="px-4 py-4"><input type="checkbox" className="rounded mt-1" /></td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#881337] text-xs">{row.id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{row.ref}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#881337]/10 text-[#881337] text-xs font-bold flex items-center justify-center shrink-0">
                          {row.initials}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">{row.school}</p>
                          <p className="text-xs text-slate-400">{row.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-semibold text-sm ${row.status === "Exception" ? "text-red-600" : "text-slate-900"}`}>
                        {row.tranche.split(" ")[0]}
                      </p>
                      <p className="text-xs text-slate-400 whitespace-nowrap">
                        {row.tranche.replace(row.tranche.split(" ")[0] + " ", "")}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                        {row.students} students
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{row.channel}</p>
                      {row.channelSub && <p className="text-xs text-slate-400">{row.channelSub}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700 whitespace-nowrap text-xs">{row.scheduled.split(" ").slice(0, 3).join(" ")}</p>
                      <p className="text-xs text-slate-400">{row.scheduled.split(" ").slice(3).join(" ")}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[row.status]}`}>
                        {row.status === "Exception" && <Icon name="alert-circle" className="w-3 h-3" />}
                        {row.status}
                        {row.exceptionCount && <span className="ml-0.5">({row.exceptionCount})</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {row.actionStyle === "solid" ? (
                        <button className="px-3 py-1.5 bg-[#881337] text-white text-xs font-semibold rounded-lg hover:bg-[#6f0e2c] transition-colors">
                          {row.action}
                        </button>
                      ) : row.actionStyle === "outline" ? (
                        <button className="px-3 py-1.5 border border-[#881337] text-[#881337] text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors">
                          {row.action}
                        </button>
                      ) : (
                        <button className="text-xs font-semibold text-slate-500 hover:text-[#881337] transition-colors">
                          {row.action}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Rows per page: 10 &nbsp; 1–5 of 45 items</span>
            <div className="flex items-center gap-1">
              {["chevrons-left","chevron-left"].map((ic) => (
                <button key={ic} className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                  <Icon name={ic} className="w-3.5 h-3.5" />
                </button>
              ))}
              {[1,2,3,"…",9].map((p, i) => (
                <button key={i} className={`w-7 h-7 text-xs font-semibold rounded border transition-colors ${p === 1 ? "bg-[#881337] text-white border-[#881337]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {p}
                </button>
              ))}
              {["chevron-right","chevrons-right"].map((ic) => (
                <button key={ic} className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                  <Icon name={ic} className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Active Settlement Exceptions Queue
              </h2>
              <span className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">3 Pending Fixes</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Sub-account verification failures and bank routing errors preventing automatic tranche release.</p>
            <div className="space-y-3">
              {EXCEPTIONS.map((ex, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="text-[#881337]">{ex.id}</span> {ex.school}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 mb-0.5 flex items-center gap-1">
                    <Icon name="alert-triangle" className="w-3 h-3 text-amber-500 shrink-0" />
                    {ex.desc}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">{ex.detail}</p>
                  <div className="flex gap-2">
                    {ex.solid ? (
                      <button className="px-3 py-1.5 bg-[#881337] text-white text-xs font-semibold rounded-lg hover:bg-[#6f0e2c] transition-colors">{ex.cta1}</button>
                    ) : (
                      <button className="px-3 py-1.5 border border-[#881337] text-[#881337] text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors">{ex.cta1}</button>
                    )}
                    <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors">{ex.cta2}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Operations SLA auto-escalation: 42 mins</span>
              <button className="text-xs text-[#881337] font-semibold hover:underline flex items-center gap-1">
                View all 18 historical exceptions <Icon name="arrow-right" className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">
                <Icon name="zap" className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Partner Settlement Rails
              </h2>
              <span className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">All Cores Active</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">Live telemetry, webhook latency and gateway handshakes for commercial bank disbursements.</p>
            <div className="space-y-4">
              {RAILS.map((rail, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{rail.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{rail.sub}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${rail.status === "Degraded" ? "text-red-600" : "text-slate-700"}`}>
                      {rail.latency} Latency
                    </p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${rail.statusColor}`}>
                      {rail.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Refreshed 2 mins ago</span>
              <button className="text-xs text-[#881337] font-semibold hover:underline">Rail Diagnostic Report</button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDisbursementsPage;
