import React, { useState } from "react";
import { Search, CheckCircle2, PhoneCall, Mail, AlertCircle, Plus } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import {
  COLLECTION_FOLLOW_UP_DATA,
  CollectionFollowUpItem,
} from "./mockFinanceData";

const FinanceCollectionFollowUpPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredItems = COLLECTION_FOLLOW_UP_DATA.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nextAction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
    const matchesOfficer = officerFilter === "All" || item.owner === officerFilter;
    return matchesSearch && matchesPriority && matchesOfficer;
  });

  const handleExport = () => {
    setFeedbackMsg("Collection follow-up queue exported successfully.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleNewAction = () => {
    setFeedbackMsg("New follow-up action modal initiated.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleLogInteraction = () => {
    setFeedbackMsg("Interaction log entry recorded with borrower contact record.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleAssignFollowUp = () => {
    setFeedbackMsg("Follow-up work item assigned to designated collections officer.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getPriorityBadge = (priority: CollectionFollowUpItem["priority"], variant: CollectionFollowUpItem["priorityVariant"]) => {
    switch (variant) {
      case "pink":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
            {priority}
          </span>
        );
      case "blue":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
            {priority}
          </span>
        );
      case "green":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            {priority}
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fafafa] font-sans overflow-hidden">
      <FinanceSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <FinanceTopBar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          breadcrumb="Repayments & collections"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Page Title & Subtitle */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Collection Follow-up
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Repayments & collections · As at 10 Oct 2026
              </p>
            </div>

            {/* Filter Dropdowns & Right Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Follow-up status</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Priority</option>
                  <option value="High">High</option>
                  <option value="Escalated">Escalated</option>
                  <option value="On track">On track</option>
                </select>

                <select
                  value={officerFilter}
                  onChange={(e) => setOfficerFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Assigned officer</option>
                  <option value="M. James">M. James</option>
                  <option value="A. Musa">A. Musa</option>
                </select>

                <select
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Due date</option>
                  <option value="Today">Today</option>
                  <option value="This week">This week</option>
                  <option value="Next week">Next week</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={handleNewAction}
                  className="px-3.5 py-1.5 bg-[#851342] text-white rounded-xl text-xs font-semibold hover:bg-[#6e0f36] transition-colors"
                >
                  + New action
                </button>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-3.5 bg-[#e6f7ed] border border-[#c1ebd0] text-[#127a3c] rounded-xl text-xs font-medium flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#127a3c]" />
                  <span>{feedbackMsg}</span>
                </div>
                <button onClick={() => setFeedbackMsg(null)} className="text-[#127a3c] hover:opacity-75">
                  ✕
                </button>
              </div>
            )}

            {/* 4 Metric Cards (Image 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Open follow up</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">62</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  12 due today
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Promised payment</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦6.8M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Within next 7 days
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Contact this week</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">112</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Calls, SMS, Email
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Escalations</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">9</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Requires supervisor review
                </span>
              </div>
            </div>

            {/* Follow-up work queue Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Follow-up work queue</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Prioritised collection assignments across finance team
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogInteraction}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Log interaction
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignFollowUp}
                    className="px-3.5 py-1.5 bg-[#851342] text-white rounded-xl text-xs font-semibold hover:bg-[#6e0f36] transition-colors"
                  >
                    Assign follow up
                  </button>
                </div>
              </div>

              {/* Real-time search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by parent, loan ID or action..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Parent / loan</th>
                      <th className="py-3 px-4">Outstanding</th>
                      <th className="py-3 px-4">Last contact</th>
                      <th className="py-3 px-4">Promise date</th>
                      <th className="py-3 px-4">Next action</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-gray-900">
                          {row.parentName} · {row.loanId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{row.outstanding}</td>
                        <td className="py-3.5 px-4 text-gray-600">{row.lastContact}</td>
                        <td className="py-3.5 px-4 text-gray-600">{row.promiseDate}</td>
                        <td className="py-3.5 px-4 text-gray-700">{row.nextAction}</td>
                        <td className="py-3.5 px-4 text-gray-700">{row.owner}</td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          {getPriorityBadge(row.priority, row.priorityVariant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's follow-up summary (Image 3) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900">Today's follow-up summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                  <span className="text-xs text-gray-400 block mb-1">Calls due</span>
                  <div className="text-2xl font-extrabold text-gray-900">14</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                  <span className="text-xs text-gray-400 block mb-1">SMS / email reminders</span>
                  <div className="text-2xl font-extrabold text-gray-900">21</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Commitments due today</span>
                    <div className="text-2xl font-extrabold text-gray-900">₦1,240,000</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
                    5 parents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceCollectionFollowUpPage;
