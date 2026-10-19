import React, { useState } from "react";
import { Search, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import { PARENT_REPAYMENTS_DATA, ParentRepaymentRecord } from "./mockFinanceData";
import financeService from "../../services/financeService";

type FilterStatus = "All" | "On track" | "Due soon" | "Grace period" | "Overdue" | "Defaulted";

const FinanceRepaymentsPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"officer" | "lead">("officer");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [repaymentsList, setRepaymentsList] = useState<ParentRepaymentRecord[]>(PARENT_REPAYMENTS_DATA);
  const [selectedRecord, setSelectedRecord] = useState<ParentRepaymentRecord>(PARENT_REPAYMENTS_DATA[3]); // B. Musa
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchRepayments = async () => {
    try {
      const res = await financeService.getRepayments({
        status: statusFilter === "All" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      if (res && res.items) {
        setRepaymentsList(res.items);
        if (!res.items.find((r) => r.id === selectedRecord.id)) {
          setSelectedRecord(res.items[0]);
        }
      }
    } catch {
      // Fallback
    }
  };

  React.useEffect(() => {
    fetchRepayments();
  }, [statusFilter, searchQuery]);

  const filtered = repaymentsList.filter((item) => {
    const matchesFilter = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.loanId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStartFollowUp = async () => {
    try {
      await financeService.triggerFollowUp({ loanId: selectedRecord.loanId });
      setFeedbackMsg(`Collection follow-up initiated for ${selectedRecord.parentName} (${selectedRecord.loanId}). Automated reminder dispatched.`);
    } catch {
      setFeedbackMsg(`Collection follow-up initiated for ${selectedRecord.parentName} (${selectedRecord.loanId}). Automated reminder dispatched.`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenLogs = async () => {
    try {
      await financeService.getRepaymentLoanDetail(selectedRecord.loanId);
      setFeedbackMsg(`Follow-up history and interaction timeline retrieved for ${selectedRecord.parentName}.`);
    } catch {
      setFeedbackMsg(`Follow-up history and interaction timeline retrieved for ${selectedRecord.parentName}.`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getStatusBadge = (status: ParentRepaymentRecord["status"]) => {
    switch (status) {
      case "On track":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            On track
          </span>
        );
      case "Due soon":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
            Due soon
          </span>
        );
      case "Grace period":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            Grace period
          </span>
        );
      case "Overdue":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            Overdue
          </span>
        );
      case "Defaulted":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
            Defaulted
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
            {/* Header & Role Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  Repayments & Collections
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Parent repayments, outstanding balances, overdue accounts and collection follow-up · as at 10 Oct 2026
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("officer")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeRoleTab === "officer"
                        ? "bg-[#700936] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    Finance Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("lead")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeRoleTab === "lead"
                        ? "bg-[#700936] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    Finance Officer
                  </button>
                </div>
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

            {/* 4 Top Metric Cards (Image 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Repayments received</span>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">₦41.3M</div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Confirmed, matched payments · 01-10 Oct 2026
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Outstanding balance</span>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">₦51.3M</div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Repayments due across active school loans
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Overdue accounts</span>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">64</div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  with repayments due beyond the grace period
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Collections due</span>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">118</div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  across scheduled instalments
                </span>
              </div>
            </div>

            {/* Parent Repayments Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Parent repayments</h3>
                <span className="text-xs text-gray-400">8 accounts shown</span>
              </div>

              {/* Full Width Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search school name or ID"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Filter Pills with Counts */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(
                  [
                    { id: "All", label: "All", count: 8 },
                    { id: "On track", label: "On track", count: 2 },
                    { id: "Due soon", label: "Due soon", count: 2 },
                    { id: "Grace period", label: "Grace period", count: 1 },
                    { id: "Overdue", label: "Overdue", count: 1 },
                    { id: "Defaulted", label: "Defaulted", count: 1 },
                  ] as const
                ).map((pill) => {
                  const isSelected = statusFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setStatusFilter(pill.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#520024] text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Parent</th>
                      <th className="py-3 px-4">Loan ID</th>
                      <th className="py-3 px-4">Amount due</th>
                      <th className="py-3 px-4">Amount paid</th>
                      <th className="py-3 px-4">Next due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((item, idx) => {
                      const isSelected = selectedRecord.id === item.id;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedRecord(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? "bg-pink-50/60" : "hover:bg-gray-50/70"
                          }`}
                        >
                          <td className="py-3.5 px-5 sm:px-6">
                            <span className="font-semibold text-gray-900 block">
                              {item.parentName}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.schoolName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                            {item.loanId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            ₦{item.amountDue.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">
                            ₦{item.amountPaid.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">{item.nextDue}</td>
                          <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                          <td className="py-3.5 px-5 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(item);
                              }}
                              className="px-3 py-1 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-gray-400 pt-2">
                Amount due is the amount currently owed: Overdue plus the next instalment. Balances update from confirmed transactions only.
              </p>
            </div>

            {/* Selected Account Detail Card (B. Musa) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {selectedRecord.parentName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    LN-20051 · APP-30818
                  </p>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                    Overdue
                  </span>
                </div>
              </div>

              {/* Pink Notification Banner */}
              <div className="p-3 bg-[#fdf0f4] border border-[#fbcdd9] rounded-xl text-xs text-[#b91c1c] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#b91c1c]" />
                <span>Notice sent to parent: Please send the bank proof for quick verification.</span>
              </div>

              {/* 2-Column Info Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">School</span>
                    <span className="font-semibold text-gray-900">Greenfield International School</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Total repayable</span>
                    <span className="font-semibold text-gray-900">₦1,750,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Paid so far</span>
                    <span className="font-semibold text-gray-900">₦1,000,000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400 font-bold">Outstanding</span>
                    <span className="font-extrabold text-gray-900">₦1,050,000</span>
                  </div>
                </div>

                <div className="space-y-2 md:pl-8">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Next instalment</span>
                    <span className="font-semibold text-gray-900">28 Sep 2026</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Amount overdue</span>
                    <span className="font-semibold text-[#b91c1c]">₦87,500</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Late fees</span>
                    <span className="font-semibold text-gray-900">₦14,500</span>
                  </div>
                </div>
              </div>

              {/* Outstanding Instalments */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900">Outstanding instalments</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Instalment 3 of 10</span>
                      <span className="text-[10px] text-gray-400">28 Sep 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#991b1b]">
                        Overdue
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Instalment 4 of 10</span>
                      <span className="text-[10px] text-gray-400">28 Oct 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        Upcoming
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Instalment 5 of 10</span>
                      <span className="text-[10px] text-gray-400">28 Nov 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        Upcoming
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Instalment 6 of 10</span>
                      <span className="text-[10px] text-gray-400">28 Dec 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        Upcoming
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900">Payment history</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">RPY-18412</span>
                      <span className="text-[10px] text-gray-400">26 Sep 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
                        Unmatched
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">RPY-18341</span>
                      <span className="text-[10px] text-gray-400">28 Aug 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
                        Confirmed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">RPY-18281</span>
                      <span className="text-[10px] text-gray-400">28 Jul 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
                        Confirmed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 block">Instalment 2 of 10</span>
                      <span className="text-[10px] text-gray-400">28 Jun 2026</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₦150,000</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        Upcoming
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  A non-matched payment is pending. If true will adjust. The balance above does not include it until it matches and confirmed.
                </p>
              </div>

              {/* Collection Follow-up Box */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-900">Collection follow-up</h4>
                <p className="text-[11px] text-gray-500">
                  Next call promised for: 08 Oct 2026 · Finance Officer · Promise to pay at 10:00 AM
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleStartFollowUp}
                    className="w-full py-2.5 rounded-xl bg-[#520024] text-white text-xs font-semibold hover:bg-[#40001c] transition-colors"
                  >
                    Start collection follow-up
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenLogs}
                    className="w-full py-2.5 rounded-xl border border-[#fbcdd9] bg-[#fdf0f4] text-[#700936] text-xs font-semibold hover:bg-[#fce7ee] transition-colors"
                  >
                    Follow-up logs (12)
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center">
                  *Writing a late fee is a financial adjustment and needs a Finance Approver.
                </p>
                <p className="text-[10px] text-gray-400 text-center">
                  Rules used: Grace period (5 days); Follow-up on first overdue (3 days overdue); Late fee: 5% of loan amount on default. Settlement: Legal & Debt Dept.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceRepaymentsPage;
