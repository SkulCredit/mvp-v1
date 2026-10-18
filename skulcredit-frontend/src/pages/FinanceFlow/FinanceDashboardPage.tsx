import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import FinanceKPIStats from "./components/FinanceKPIStats";
import FinanceDisbursementsChart from "./components/FinanceDisbursementsChart";
import FinanceLoanPortfolio from "./components/FinanceLoanPortfolio";
import FinancePendingActions from "./components/FinancePendingActions";
import FinanceQuickActions from "./components/FinanceQuickActions";
import FinanceRecentTransactions from "./components/FinanceRecentTransactions";
import FinanceSchoolPerformance from "./components/FinanceSchoolPerformance";
import FinanceCalculationFooter from "./components/FinanceCalculationFooter";
import financeService, { DashboardStatsData } from "../../services/financeService";

const FinanceDashboardPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardStatsData | null>(null);

  const fetchStats = async (period: "6M" | "12M" = "12M") => {
    try {
      const data = await financeService.getDashboardStats(period);
      setDashboardData(data);
    } catch {
      // Handled via fallback in service
    }
  };

  useEffect(() => {
    fetchStats("12M");
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#fafafa] font-sans overflow-hidden">
      {/* Deep Plum Left Sidebar */}
      <FinanceSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Navigation */}
        <FinanceTopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1360px] mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Finance Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Disbursements, repayments and exceptions at a glance · as at 18 Oct 2026
              </p>
            </div>

            {/* Global Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search disbursement ID, loan ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm placeholder:text-gray-400 text-gray-800 shadow-2xs focus:outline-none focus:border-[#700936] focus:ring-1 focus:ring-[#700936] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 4 Metric / KPI Cards */}
            <FinanceKPIStats metrics={dashboardData?.metrics} />

            {/* Disbursements vs Repayments Chart */}
            <FinanceDisbursementsChart
              chartData={dashboardData?.chartData}
              onRangeChange={(range) => fetchStats(range === "12" ? "12M" : "6M")}
            />

            {/* Loan Portfolio Status */}
            <FinanceLoanPortfolio portfolioStatus={dashboardData?.portfolioStatus} />

            {/* Pending Actions */}
            <FinancePendingActions actions={dashboardData?.pendingActions} />

            {/* Quick Actions */}
            <FinanceQuickActions />

            {/* Recent Transactions Table */}
            <FinanceRecentTransactions
              searchQuery={searchQuery}
              transactions={dashboardData?.recentTransactions}
            />

            {/* School Performance Table */}
            <FinanceSchoolPerformance schools={dashboardData?.schoolPerformance} />

            {/* Calculation Footnote Info Box */}
            <FinanceCalculationFooter />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
