import React, { useState } from "react";
import { Search, CheckCircle2, ChevronDown, Download } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import {
  PARENT_REPAYMENTS_DATA,
  ParentRepaymentRecord,
  AGING_OVERDUE_BUCKETS,
  SCHOOL_OUTSTANDING_BREAKDOWN,
} from "./mockFinanceData";
import financeService, { OutstandingBalancesResponse } from "../../services/financeService";

type FilterStatus = "All" | "On track" | "Due soon" | "Grace period" | "Overdue" | "Defaulted";

const FinanceOutstandingBalancesPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"officer" | "lead">("officer");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"high-low" | "low-high">("high-low");
  const [selectedRecord, setSelectedRecord] = useState<ParentRepaymentRecord>(PARENT_REPAYMENTS_DATA[3]); // B. Musa
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [balancesData, setBalancesData] = useState<OutstandingBalancesResponse | null>(null);

  React.useEffect(() => {
    const fetchBalances = async () => {
      try {
        const data = await financeService.getOutstandingBalances();
        if (data) setBalancesData(data);
      } catch {
        // Fallback preserved
      }
    };
    fetchBalances();
  }, []);

  const agingBuckets = balancesData?.buckets || AGING_OVERDUE_BUCKETS;
  const schoolBreakdown = balancesData?.schoolBreakdown || SCHOOL_OUTSTANDING_BREAKDOWN;

  const filtered = PARENT_REPAYMENTS_DATA.filter((item) => {
    const matchesFilter = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.loanId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === "high-low") return b.outstanding - a.outstanding;
    return a.outstanding - b.outstanding;
  });

  const handleSendFollowUp = async () => {
    try {
      await financeService.triggerFollowUp({ loanId: selectedRecord.loanId });
      setFeedbackMsg(`Collection follow-up initiated for ${selectedRecord.parentName} (${selectedRecord.loanId}).`);
    } catch {
      setFeedbackMsg(`Collection follow-up initiated for ${selectedRecord.parentName} (${selectedRecord.loanId}).`);
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
          breadcrumb="Outstanding balances"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Header & Role Toggles (Screenshot 4) */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  Outstanding balances
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  What parents still owe across active loans · snapshot as at 10 Oct 2026
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

            {/* 4 Top Metric Cards (Screenshot 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Total outstanding</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦412.5M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Across 2,184 active school loans
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Active linked loans</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">2,184</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Education finance partners
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Average outstanding / loan</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦189K</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Principal and interest balances
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Collections due</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦61.1M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Expected within next 30 days
                </span>
              </div>
            </div>

            {/* Card 1: Balance by days overdue */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Balance by days overdue</h3>
              <div className="space-y-3">
                {AGING_OVERDUE_BUCKETS.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">{item.bucket}</span>
                      <span className="font-bold text-gray-900">
                        {item.amount} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Balance by school */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Balance by school</h3>
              <div className="space-y-3">
                {SCHOOL_OUTSTANDING_BREAKDOWN.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">{item.school}</span>
                      <span className="font-bold text-gray-900">
                        {item.balance} · {item.loans} loans ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentage * 2}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent Repayments Card (Screenshot 4) */}
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
                      <th className="py-3 px-4">Total repayable</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Outstanding</th>
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
                          <td className="py-3.5 px-4 text-gray-700">
                            ₦{item.totalRepayable.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">
                            ₦{item.amountPaid.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            ₦{item.outstanding.toLocaleString()}
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
            </div>

            {/* B. Musa Detail Card (Screenshot 4) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    B. Musa
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Greenfield International School
                  </p>
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                    Overdue
                  </span>
                </div>
              </div>

              {/* Outstanding Amount Header with Progress Bar */}
              <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2">
                <span className="text-xs text-gray-500 block">Outstanding amount</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#700936] block tracking-tight">
                  ₦4,080,000
                </span>
                <span className="text-[11px] text-gray-400 block">Cumulative remaining</span>
                <div className="w-full h-2 rounded-full bg-gray-200 mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-[#851342]" style={{ width: "75%" }} />
                </div>
              </div>

              {/* Info Details */}
              <div className="space-y-2 text-xs py-1">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Total repayable</span>
                  <span className="font-semibold text-gray-900">₦5,100,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Amount disbursed</span>
                  <span className="font-semibold text-gray-900">₦4,250,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Other fees applied</span>
                  <span className="font-semibold text-gray-900">₦20,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Next instalment due</span>
                  <span className="font-semibold text-gray-900">28 Sep 2026</span>
                </div>
              </div>

              {/* Instalments List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-900 block">Instalment 3 of 12</span>
                    <span className="text-[10px] text-gray-400">28 Sep 2026</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₦140,000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#991b1b]">
                      Overdue
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-900 block">Instalment 4 of 12</span>
                    <span className="text-[10px] text-gray-400">28 Oct 2026</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₦140,000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      Upcoming
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-900 block">Instalment 5 of 12</span>
                    <span className="text-[10px] text-gray-400">28 Nov 2026</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₦140,000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      Upcoming
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-900 block">Instalment 6 of 12</span>
                    <span className="text-[10px] text-gray-400">28 Dec 2026</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">₦140,000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSendFollowUp}
                className="w-full py-3 rounded-xl bg-[#851342] text-white text-xs sm:text-sm font-semibold hover:bg-[#6e0f36] transition-colors shadow-xs"
              >
                Send collection follow-up
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceOutstandingBalancesPage;
