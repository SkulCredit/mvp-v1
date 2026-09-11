import React from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  DashboardTopBar,
  SchoolSidebar,
} from "../../components/layout";

interface DisbursementRow {
  initials: string;
  name: string;
  amount: string;
  date: string;
  status: "completed" | "pending";
  ref: string;
}

const ROWS: DisbursementRow[] = [
  {
    initials: "AN",
    name: "Amaka N.",
    amount: "₦150,000",
    date: "20 Nov",
    status: "completed",
    ref: "SCH-23832",
  },
  {
    initials: "JO",
    name: "John O.",
    amount: "₦200,000",
    date: "18 Nov",
    status: "completed",
    ref: "SCH-23835",
  },
  {
    initials: "SA",
    name: "Sarah A.",
    amount: "₦120,000",
    date: "Pending",
    status: "pending",
    ref: "SCH-23836",
  },
  {
    initials: "IK",
    name: "Ibrahim K.",
    amount: "₦180,000",
    date: "19 Nov",
    status: "completed",
    ref: "SCH-23837",
  },
  {
    initials: "CP",
    name: "Chioma P.",
    amount: "₦95,000",
    date: "17 Nov",
    status: "pending",
    ref: "SCH-238390",
  },
  {
    initials: "YM",
    name: "Yusuf M.",
    amount: "₦200,000",
    date: "19 Nov",
    status: "completed",
    ref: "SCH-238323",
  },
];

const SchoolDisbursementPage: React.FC = () => (
  <DashboardLayout
    sidebar={<SchoolSidebar />}
    header={<DashboardTopBar notificationCount={1} />}
  >
    <div className="max-w-[1200px] mx-auto space-y-8 pt-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Disbursement</h1>
        <p className="text-sm text-slate-500 font-medium">
          Track all tuition payments successfully remitted to your school.
        </p>
      </div>

      {/* Summary cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            {
              icon: "bar-chart",
              label: "Total Disbursed",
              value: "₦4,250,000",
            },
            { icon: "clock", label: "Pending Disbursement", value: "₦320,000" },
            {
              icon: "calendar-check",
              label: "Last Payment",
              value: "20 Nov 2025",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="pt-4 md:pt-0 md:pl-12 first:pl-0 first:pt-0"
            >
              <p className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
                <Icon name={item.icon} className="w-4 h-4" /> {item.label}
              </p>
              <h2 className="text-3xl font-extrabold text-brand">
                {item.value}
              </h2>
            </div>
          ))}
        </div>
      </div>

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">
          Disbursement History
        </h2>
        <button className="w-full sm:w-auto px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-hover transition-all flex items-center justify-center gap-2">
          <Icon name="calendar" className="w-4 h-4" /> All Status
        </button>
      </div>

      {/* Table */}
      <div className="space-y-3 pb-10">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-center">Payment Ref</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {ROWS.map((row) => (
          <div
            key={row.ref}
            className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-4 lg:px-6 relative flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center"
          >
            {row.status === "pending" && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-2xl" />
            )}
            <div className="col-span-3 flex items-center gap-4 w-full">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                {row.initials}
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm lg:text-base">
                {row.name}
              </h4>
            </div>
            <div className="col-span-2 w-full">
              <p className="text-sm font-black text-slate-800">{row.amount}</p>
            </div>
            <div className="col-span-2 w-full">
              <p className="text-sm font-bold text-slate-600">{row.date}</p>
            </div>
            <div className="col-span-2 w-full">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-max ${row.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
              >
                {row.status === "completed" ? "Completed" : "Pending"}
              </span>
            </div>
            <div className="col-span-2 text-left lg:text-center w-full">
              <p className="text-xs font-mono text-slate-500">{row.ref}</p>
            </div>
            <div className="col-span-1 flex justify-start lg:justify-end w-full mt-2 lg:mt-0">
              {row.status === "completed" ? (
                <button className="px-5 py-1.5 bg-brand-50 hover:bg-brand text-brand hover:text-white border border-brand/20 font-bold text-xs rounded-lg transition-colors">
                  View
                </button>
              ) : (
                <button className="px-5 py-1.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed">
                  View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export actions */}
      <div className="flex gap-4 pb-4">
        <button className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-brand font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm text-sm">
          <Icon name="download" className="w-4 h-4" /> Export CSV
        </button>
        <button className="px-6 py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm text-sm">
          <Icon name="file-text" className="w-4 h-4" /> Download Statement
        </button>
      </div>
    </div>
  </DashboardLayout>
);

export default SchoolDisbursementPage;
