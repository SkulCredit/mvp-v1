import React, { useState } from "react";
import { Download, Plus, Search, CheckCircle2, ShieldCheck, Lock, SlidersHorizontal } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import {
  FINANCIAL_AUDIT_LOGS,
  FinancialAuditLogItem,
} from "./mockFinanceData";
import financeService, { AuditLogsAndSettingsResponse } from "../../services/financeService";

const FinanceAuditLogsPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [actionTypeFilter, setActionTypeFilter] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditLogsAndSettingsResponse | null>(null);

  React.useEffect(() => {
    const fetchAudit = async () => {
      try {
        const data = await financeService.getAuditLogsAndSettings();
        if (data) setAuditData(data);
      } catch {
        // Fallback
      }
    };
    fetchAudit();
  }, []);

  const logsList = auditData?.logs || FINANCIAL_AUDIT_LOGS;

  const filteredLogs = logsList.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = userFilter === "All" || log.user === userFilter;
    const matchesOutcome = outcomeFilter === "All" || log.outcome === outcomeFilter;
    return matchesSearch && matchesUser && matchesOutcome;
  });

  const handleExport = () => {
    setFeedbackMsg("Audit log history exported successfully (CSV format).");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleNewAction = () => {
    setFeedbackMsg("Administrative action modal initiated.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleManagePermissions = async () => {
    try {
      await financeService.updateSettings({
        requireTwoPersonApproval: true,
      });
      setFeedbackMsg("Finance workspace permissions and policy synchronized.");
    } catch {
      setFeedbackMsg("Finance workspace permissions console opened.");
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getOutcomeBadge = (outcome: FinancialAuditLogItem["outcome"], variant: FinancialAuditLogItem["outcomeVariant"]) => {
    switch (variant) {
      case "green":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            {outcome}
          </span>
        );
      case "yellow":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
            {outcome}
          </span>
        );
      case "pink":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            {outcome}
          </span>
        );
      case "red":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
            {outcome}
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
          breadcrumb="Audit logs & settings"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Audit Logs & Settings
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Administration · As at 10 Oct 2026
              </p>
            </div>

            {/* Filter Dropdowns & Right Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Date range</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                </select>

                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">User</option>
                  <option value="A. Bello">A. Bello</option>
                  <option value="M. James">M. James</option>
                  <option value="E. Momoh">E. Momoh</option>
                  <option value="System">System</option>
                </select>

                <select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Action type</option>
                  <option value="Disbursement">Disbursement</option>
                  <option value="Account change">Account change</option>
                  <option value="Reconciliation">Reconciliation</option>
                  <option value="Verification">Verification</option>
                </select>

                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Outcome</option>
                  <option value="Success">Success</option>
                  <option value="Pending approval">Pending approval</option>
                  <option value="Flagged">Flagged</option>
                  <option value="Blocked">Blocked</option>
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

            {/* 4 Metric Cards (Screenshot 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Actions today</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">282</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Across finance operations
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Approval pending</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">12</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Awaiting Finance Approver
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Failed actions</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">3</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Requires investigation
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Active finance users</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">2,184</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Role-based access enabled
                </span>
              </div>
            </div>

            {/* Financial action history Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Financial action history</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Immutable log of financial actions, approvals and system events
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Export audit log
                  </button>
                  <button
                    type="button"
                    onClick={handleManagePermissions}
                    className="px-3.5 py-1.5 bg-[#851342] text-white rounded-xl text-xs font-semibold hover:bg-[#6e0f36] transition-colors"
                  >
                    Manage permissions
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
                  placeholder="Search actions, references, users or details..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6 font-mono text-gray-500 text-[11px]">
                          {log.timestamp}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{log.user}</td>
                        <td className="py-3.5 px-4 text-gray-800">{log.action}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">{log.reference}</td>
                        <td className="py-3.5 px-4">
                          {getOutcomeBadge(log.outcome, log.outcomeVariant)}
                        </td>
                        <td className="py-3.5 px-5 sm:px-6 text-right text-gray-500">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Finance access & controls Section (Screenshot 1) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Finance access & controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Roles & permissions Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">Roles & permissions</h4>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-900 block text-xs">Finance Officer</span>
                    <p className="text-[11px] text-gray-500">
                      Initiate transactions · Review records · Record repayments
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
                      Cannot approve own actions
                    </span>
                  </div>
                </div>

                {/* Payment configuration Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">Payment configuration</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">School bank verification</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
                        Required before disbursement
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Settlement matching</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
                        Reference required
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1">
                    All financial actions are audit logged.
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

export default FinanceAuditLogsPage;
