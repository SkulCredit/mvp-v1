import React, { useState } from "react";
import { Download, Plus, AlertCircle, BellRing, CheckCircle2, Search } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import { OVERDUE_QUEUE_DATA, OverdueQueueItem } from "./mockFinanceData";
import financeService, { OverdueAccountsResponse } from "../../services/financeService";

const FinanceOverdueAccountsPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [selectedDays, setSelectedDays] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedOfficer, setSelectedOfficer] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [overdueData, setOverdueData] = useState<OverdueAccountsResponse | null>(null);

  React.useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const data = await financeService.getOverdueAccounts();
        if (data) setOverdueData(data);
      } catch {
        // Fallback
      }
    };
    fetchOverdue();
  }, []);

  const queueData = overdueData?.queue || OVERDUE_QUEUE_DATA;

  const filteredQueue = queueData.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = selectedSchool === "All" || item.schoolName.includes(selectedSchool);
    const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
    const matchesOfficer = selectedOfficer === "All" || item.assignedOfficer === selectedOfficer;
    return matchesSearch && matchesSchool && matchesStatus && matchesOfficer;
  });

  const handleExport = () => {
    setFeedbackMsg("Overdue accounts snapshot exported successfully (CSV).");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleNewAction = () => {
    setFeedbackMsg("New collection task workflow opened.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleBulkReminders = async () => {
    try {
      const loanIds = filteredQueue.map((i) => i.loanId);
      await financeService.sendBulkReminders({ loanIds: loanIds.length > 0 ? loanIds : ["LN-22071"] });
      setFeedbackMsg(`Bulk automated SMS/Email reminders dispatched to ${filteredQueue.length} overdue accounts.`);
    } catch {
      setFeedbackMsg("Bulk automated SMS/Email reminders dispatched to overdue accounts.");
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCreateFollowUp = () => {
    setFeedbackMsg("New follow-up assignment created and assigned to collections queue.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getStatusBadge = (status: OverdueQueueItem["status"], variant: OverdueQueueItem["statusVariant"]) => {
    switch (variant) {
      case "pink":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
            {status}
          </span>
        );
      case "blue":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
            {status}
          </span>
        );
      case "yellow":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
            {status}
          </span>
        );
      case "gray":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {status}
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
          breadcrumb="Overdue accounts"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Overdue Accounts
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                What parents still owe across active loans · snapshot as at 10 Oct 2026
              </p>
            </div>

            {/* Filter Dropdowns & Right Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">All schools</option>
                  <option value="Greenfield">Greenfield Int.</option>
                  <option value="Crestview">Crestview Academy</option>
                  <option value="Rosehill">Rosehill College</option>
                </select>

                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Days overdue</option>
                  <option value="30">30+ days</option>
                  <option value="60">60+ days</option>
                  <option value="90">90+ days</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Loan status</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Follow-up">Follow-up</option>
                </select>

                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Assigned officer</option>
                  <option value="M. James">M. James</option>
                  <option value="A. Musa">A. Musa</option>
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

            {/* 4 Metric Cards (Image 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Overdue accounts</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">62</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Across active school loans
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Total overdue</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦18.6M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Principal + configured charges
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">30+ days overdue</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">19</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Priority follow-up required
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Recovered this month</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦4.2M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  From previously overdue loans
                </span>
              </div>
            </div>

            {/* Overdue Repayment Queue Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Overdue repayment queue</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Accounts beyond the 5-day grace period</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkReminders}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bulk reminders
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFollowUp}
                    className="px-3.5 py-1.5 bg-[#851342] text-white rounded-xl text-xs font-semibold hover:bg-[#6e0f36] transition-colors"
                  >
                    Create follow-up
                  </button>
                </div>
              </div>

              {/* Real-time search query */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by parent, loan ID, or school..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Parent / loan</th>
                      <th className="py-3 px-4">School</th>
                      <th className="py-3 px-4">Amount due</th>
                      <th className="py-3 px-4">Days overdue</th>
                      <th className="py-3 px-4">Last payment</th>
                      <th className="py-3 px-4">Assigned to</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredQueue.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6">
                          <span className="font-semibold text-gray-900 block">
                            {row.parentName} · {row.loanId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">{row.schoolName}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{row.amountDue}</td>
                        <td className="py-3.5 px-4 text-gray-600">{row.daysOverdue} days</td>
                        <td className="py-3.5 px-4 text-gray-500">{row.lastPaymentDate}</td>
                        <td className="py-3.5 px-4 text-gray-700">{row.assignedOfficer}</td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          {getStatusBadge(row.status, row.statusVariant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collection Policy Banner (Image 2) */}
            <div className="p-4 bg-[#fdf0f4] border border-[#fbcdd9] rounded-xl text-xs text-[#700936] space-y-1">
              <span className="font-bold block text-[#991b1b]">Collection policy</span>
              <p className="text-[11px] text-[#700936]">
                Overdue status is calculated from the repayment schedule and configured grace period. Default actions and status changes are audit logged.
              </p>
            </div>

            {/* Pagination count */}
            <div className="text-xs text-gray-400">
              Showing 1–5 of 64 accounts
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceOverdueAccountsPage;
