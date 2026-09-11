import React from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  DashboardTopBar,
  SchoolSidebar,
} from "../../components/layout";

const STUDENTS = [
  {
    initials: "JM",
    name: "Jone Mane",
    id: "STU-88321",
    level: "Primary",
    cls: "Class P2",
    statusLabel: "Active Account",
    statusColor: "emerald",
  },
  {
    initials: "SO",
    name: "Sarah Okoro",
    id: "STU-88322",
    level: "Secondary",
    cls: "Class SS1",
    statusLabel: "Application Pending",
    statusColor: "amber",
  },
  {
    initials: "IL",
    name: "Ibrahim Lawal",
    id: "STU-88323",
    level: "Tertiary",
    cls: "100L",
    statusLabel: "Active Account",
    statusColor: "emerald",
  },
];

const SchoolStudentsPage: React.FC = () => (
  <DashboardLayout
    sidebar={<SchoolSidebar />}
    header={<DashboardTopBar notificationCount={1} />}
  >
    <div className="max-w-[1100px] mx-auto space-y-6 pt-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-1">
            Student Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage all enrolled students and monitor their active tuition
            status.
          </p>
        </div>
        <button className="bg-brand hover:bg-brand-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap">
          <Icon name="user-plus" className="w-4 h-4" /> Add New Student
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-2 justify-between items-center w-full">
        <div className="relative w-full lg:flex-1 lg:max-w-md">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by student name or ID…"
            className="w-full pl-10 pr-4 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
          {["All", "Primary", "Secondary", "Tertiary"].map((label) => (
            <button
              key={label}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all whitespace-nowrap hover:border-brand hover:text-brand"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
        <div className="col-span-4">Student Name & ID</div>
        <div className="col-span-3">Level & Class</div>
        <div className="col-span-3">Account Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="space-y-4 pb-10">
        {STUDENTS.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-slate-100 rounded-3xl p-4 px-6 cursor-pointer flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center hover:shadow-sm transition-all"
          >
            <div className="col-span-4 flex items-center gap-4 w-full">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-slate-600 font-bold shrink-0">
                {s.initials}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-[15px]">
                  {s.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {s.id}
                </p>
              </div>
            </div>
            <div className="col-span-3 w-full">
              <p className="text-sm font-bold text-slate-700">{s.level}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {s.cls}
              </p>
            </div>
            <div className="col-span-3 w-full">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${s.statusColor === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${s.statusColor === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                {s.statusLabel}
              </span>
            </div>
            <div className="col-span-2 flex justify-end w-full">
              <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors">
                <Icon name="chevron-right" className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default SchoolStudentsPage;
