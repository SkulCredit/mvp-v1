import React, { useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";

// ── Types ─────────────────────────────────────────────────────────────────────

type TicketStatus = "Open" | "Closed" | "In Progress";

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  date: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const TICKETS: Ticket[] = [
  { id: "#20321", subject: "Disbursement Delay",     status: "Open",        date: "19 Nov" },
  { id: "#20284", subject: "Application Processing", status: "Closed",      date: "17 Nov" },
  { id: "#20250", subject: "Document Upload Issue",  status: "In Progress", date: "15 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "12 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "13 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "In Progress", date: "14 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "18 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "18 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "18 Nov" },
  { id: "#20198", subject: "Account Verification",   status: "Closed",      date: "18 Nov" },
];

const STATUS_CLS: Record<TicketStatus, string> = {
  Open:        "bg-white text-blue-600 border border-blue-300",
  Closed:      "bg-white text-slate-600 border border-slate-300",
  "In Progress":"bg-amber-50 text-amber-600 border border-amber-200",
};

// ── Page ──────────────────────────────────────────────────────────────────────

const SchoolSupportPage: React.FC = () => {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const visible = TICKETS.filter((t) => {
    const matchStatus = statusFilter === "All Status" || t.status === statusFilter;
    const matchSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout
      sidebar={<SchoolSidebar />}
      header={<SchoolTopBar />}
    >
      <div className="max-w-3xl mx-auto pt-8 space-y-5 animate-fade-in-up">

        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-slate-900">Support</h1>
          <p className="text-sm text-slate-500">Get help, raise complaints, or track your support tickets.</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
          <button className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-[#7a1848] transition-colors">
            <Icon name="plus" className="w-4 h-4" />
            Submit Ticket
          </button>
          <button className="w-full flex items-center justify-center gap-2 border border-brand text-brand font-semibold py-3 rounded-xl hover:bg-brand/5 transition-colors">
            <Icon name="help-circle" className="w-4 h-4" />
            FAQs
          </button>
          <button className="w-full flex items-center justify-center gap-2 border border-brand text-brand font-semibold py-3 rounded-xl hover:bg-brand/5 transition-colors">
            <Icon name="message-circle" className="w-4 h-4" />
            Chat with Support
          </button>
        </div>

        {/* Search + filter */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="-Search by student or payment reference ID-"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-brand text-white text-sm font-semibold pl-4 pr-8 py-2.5 rounded-lg focus:outline-none cursor-pointer"
            >
              {["All Status", "Open", "Closed", "In Progress"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ticket list */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Your Tickets</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr] px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
              <span>Ticket ID</span>
              <span>Subject</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>

            {visible.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No tickets found.</div>
            ) : (
              visible.map((t, i) => (
                <div
                  key={`${t.id}-${i}`}
                  className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-mono text-slate-600">{t.id}</span>
                  <span className="text-sm text-slate-700">{t.subject}</span>
                  <span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[t.status]}`}>
                      {t.status}
                    </span>
                  </span>
                  <span className="text-sm text-slate-500">{t.date}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand">
                    View <Icon name="chevron-right" className="w-4 h-4" />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSupportPage;
