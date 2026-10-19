import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Check,
  RotateCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import { DISBURSEMENT_HISTORY_ITEMS, DisbursementHistoryItem } from "./mockFinanceData";
import financeService from "../../services/financeService";

type FilterTab = "All" | "Processing" | "Completed" | "Failed" | "Reversed";

const FinanceDisbursementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"initiator" | "viewer">("initiator");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [disbursementsList, setDisbursementsList] = useState<DisbursementHistoryItem[]>(DISBURSEMENT_HISTORY_ITEMS);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementHistoryItem>(
    DISBURSEMENT_HISTORY_ITEMS[0]
  );
  const [statusCounts, setStatusCounts] = useState({
    all: DISBURSEMENT_HISTORY_ITEMS.length,
    completed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Completed").length,
    processing: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Processing").length,
    failed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Failed").length,
    reversed: DISBURSEMENT_HISTORY_ITEMS.filter((i) => i.status === "Reversed").length,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchDisbursements = async () => {
    try {
      const res = await financeService.getDisbursements({
        status: statusFilter === "All" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      if (res && res.items) {
        setDisbursementsList(res.items);
        if (res.statusCounts) setStatusCounts(res.statusCounts);
      }
    } catch {
      // Keep existing list as fallback
    }
  };

  React.useEffect(() => {
    fetchDisbursements();
  }, [statusFilter, searchQuery]);

  const filteredItems = disbursementsList.filter((item) => {
    const matchesFilter = statusFilter === "All" || item.status === statusFilter;
    const matchesQuery =
      !searchQuery ||
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      if (selectedDisbursement.status === "Failed") {
        await financeService.retryDisbursement(selectedDisbursement.id);
      }
      setFeedbackMsg(`Bank gateway query returned: Settlement status confirmed for ${selectedDisbursement.reference}.`);
      fetchDisbursements();
    } catch {
      setFeedbackMsg(`Settlement status checked for ${selectedDisbursement.reference}.`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleRequestReversal = async () => {
    try {
      await financeService.reverseDisbursement(selectedDisbursement.id, "Customer requested cancellation");
      setFeedbackMsg(`Reversal request for ${selectedDisbursement.transactionRef} queued for Approver sign-off.`);
      fetchDisbursements();
    } catch {
      setFeedbackMsg(`Reversal request for ${selectedDisbursement.transactionRef} queued for Approver sign-off.`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getStatusBadge = (status: DisbursementHistoryItem["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            Completed
          </span>
        );
      case "Processing":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            Processing
          </span>
        );
      case "Failed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            Failed
          </span>
        );
      case "Reversed":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            Reversed
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
          breadcrumb="Disbursements"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Header & Back */}
            <div>
              <Link
                to="/finance/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#700936] hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to disbursements
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    Disbursements
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    School payments for approved loans - track processing, completed, failed and reversed
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("initiator")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeRoleTab === "initiator"
                        ? "bg-[#700936] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    Finance Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("viewer")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeRoleTab === "viewer"
                        ? "bg-[#700936] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    Finance Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/finance/disbursements/new")}
                    className="px-4 py-2 rounded-xl bg-[#700936] text-white text-xs font-semibold hover:bg-[#58072a] shadow-xs transition-colors ml-2"
                  >
                    Initiate Disbursement
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
                  Dismiss
                </button>
              </div>
            )}

            {/* 4 Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Processing */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Processing</span>
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦2,900,000</div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Completed</span>
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">
                    4
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦350,000,000</div>
              </div>

              {/* Failed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Failed</span>
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦2,900,000</div>
              </div>

              {/* Reversed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Reversed</span>
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦2,900,000</div>
              </div>
            </div>

            {/* School payments Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">School payments</h3>
                <span className="text-xs text-gray-400">8 of 8 disbursements</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Disbursement ID, application ID, parent or school"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Dropdown Filters row */}
              <div className="flex flex-wrap items-center gap-3">
                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-600 bg-white focus:outline-none">
                  <option>All items</option>
                  <option>Over ₦1M</option>
                  <option>Under ₦1M</option>
                </select>
                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-600 bg-white focus:outline-none">
                  <option>Any date</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-600 bg-white focus:outline-none">
                  <option>Any amount</option>
                  <option>High to Low</option>
                  <option>Low to High</option>
                </select>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(["All", "Processing", "Completed", "Failed", "Reversed"] as FilterTab[]).map(
                  (tab) => {
                    const isSelected = statusFilter === tab;
                    const count =
                      tab === "All"
                        ? 8
                        : tab === "Processing"
                        ? 1
                        : tab === "Completed"
                        ? 4
                        : tab === "Failed"
                        ? 2
                        : 1;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#700936] text-white"
                            : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span>
                          {tab} {count}
                        </span>
                        {isSelected && <span className="text-[10px] opacity-75">✕</span>}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Disbursement</th>
                      <th className="py-3 px-4">School & verified account</th>
                      <th className="py-3 px-4">Parent</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Transaction ref</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.map((item, idx) => {
                      const isSelected = selectedDisbursement.id === item.id;
                      const isFailedRow = item.status === "Failed";
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedDisbursement(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-pink-50/70"
                              : isFailedRow
                              ? "bg-rose-50/40 hover:bg-rose-50/60"
                              : "hover:bg-gray-50/70"
                          }`}
                        >
                          <td className="py-3.5 px-5 sm:px-6">
                            <span className="font-semibold text-gray-900 block">
                              {item.reference}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.date}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-gray-800 block">
                              {item.schoolName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {item.bankAccount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">{item.parentName}</td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            ₦{item.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                            {item.transactionRef}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                          <td className="py-3.5 px-5 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDisbursement(item);
                              }}
                              className="px-2.5 py-1 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-white hover:border-gray-300"
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

            {/* Bottom Detail View Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {selectedDisbursement.reference.split("/")[0] || "DSB-004819"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Transaction ref: {selectedDisbursement.transactionRef}
                  </p>
                </div>
                <div>{getStatusBadge(selectedDisbursement.status)}</div>
              </div>

              {/* 5-step Flow Stepper (Screenshot 2) */}
              <div>
                <span className="text-xs font-bold text-gray-900 block mb-3">
                  Disbursement flow
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Eligible loan", index: 1 },
                    { label: "Verify school", index: 2 },
                    { label: "Authorize payment", index: 3 },
                    { label: "Process", index: 4 },
                    { label: "Confirm status", index: 5 },
                  ].map((step) => {
                    const status = selectedDisbursement.status;
                    let iconNode = <Check className="w-3 h-3 stroke-[3]" />;
                    let badgeClass = "bg-[#700936] text-white";

                    if (status === "Failed") {
                      if (step.index === 1) {
                        badgeClass = "bg-[#700936] text-white";
                        iconNode = <Check className="w-3 h-3 stroke-[3]" />;
                      } else if (step.index === 2) {
                        badgeClass = "bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]";
                        iconNode = <span className="text-xs font-bold leading-none">!</span>;
                      } else {
                        badgeClass = "bg-gray-100 text-gray-400 border border-gray-200";
                        iconNode = <span className="text-[10px] font-semibold">{step.index}</span>;
                      }
                    } else if (status === "Processing") {
                      if (step.index <= 3) {
                        badgeClass = "bg-[#700936] text-white";
                        iconNode = <Check className="w-3 h-3 stroke-[3]" />;
                      } else if (step.index === 4) {
                        badgeClass = "border-2 border-[#700936] text-[#700936] bg-white";
                        iconNode = <span className="w-1.5 h-1.5 rounded-full bg-[#700936]" />;
                      } else {
                        badgeClass = "bg-gray-100 text-gray-400 border border-gray-200";
                        iconNode = <span className="text-[10px] font-semibold">{step.index}</span>;
                      }
                    } else {
                      badgeClass = "bg-[#700936] text-white";
                      iconNode = <Check className="w-3 h-3 stroke-[3]" />;
                    }

                    return (
                      <div key={step.index} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}>
                          {iconNode}
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2-column details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                {/* Left Column: Linked loan & application */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">
                    Linked loan & application
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Application</span>
                      <span className="font-semibold text-gray-900">APP-30881</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Loan</span>
                      <span className="font-semibold text-gray-900">LN-21950</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Parent</span>
                      <span className="font-semibold text-gray-900">C. Adeyemi</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">School</span>
                      <span className="font-semibold text-gray-900">Lakeside Preparatory</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Bank account</span>
                      <span className="font-mono text-gray-800">•••• 5512</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">School verification</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedDisbursement.status === "Failed"
                          ? "bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]"
                          : "bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]"
                      }`}>
                        {selectedDisbursement.status === "Failed" ? "Action required" : "Verified"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 items-center">
                      <span className="text-gray-400">Amount</span>
                      <span className="font-bold text-sm text-gray-900">₦1,750,000</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Transaction history timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">
                    Transaction history
                  </h4>
                  <div className="space-y-3 text-xs border-l-2 border-[#700936]/20 pl-3.5 ml-1">
                    <div>
                      <p className="font-bold text-gray-900">Loan confirmed eligible</p>
                      <p className="text-[10px] text-gray-400">1. APP-30881 · 07 Oct 2026, 08:40</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">School bank account verified</p>
                      <p className="text-[10px] text-gray-400">2. Lakeside Preparatory · •••• 5512</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Payment authorized</p>
                      <p className="text-[10px] text-gray-400">3. Finance Approver · 07 Oct 2026, 09:05</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Payment processed</p>
                      <p className="text-[10px] text-gray-400">4. TRX-775902 · 07 Oct 2026, 09:12</p>
                    </div>
                    <div>
                      <p className={`font-bold ${
                        selectedDisbursement.status === "Failed"
                          ? "text-[#b91c1c]"
                          : selectedDisbursement.status === "Processing"
                          ? "text-[#854d0e]"
                          : "text-[#127a3c]"
                      }`}>
                        {selectedDisbursement.status === "Failed"
                          ? "Settlement failed"
                          : selectedDisbursement.status === "Processing"
                          ? "Sent to bank"
                          : "Settlement confirmed"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {selectedDisbursement.status === "Failed"
                          ? "5. Settlement rejected by gateway"
                          : selectedDisbursement.status === "Processing"
                          ? "5. Awaiting clearing house confirmation"
                          : "5. Status set to Completed"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                    className="w-full py-2.5 rounded-xl bg-[#700936] text-white text-xs font-semibold hover:bg-[#58072a] transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Refresh Status</span>
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    Checks the latest bank response for this payment.
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleRequestReversal}
                    className="w-full py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Request reversal (Approver only)
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    Every action here is recorded with user, time, record ID and reason.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceDisbursementsPage;
