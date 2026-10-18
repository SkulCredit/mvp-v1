import React, { useState } from "react";
import { Download, Plus, CheckCircle2, FileText, Search } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import {
  FINANCIAL_REPORTS_LIST,
  FinancialReportItem,
  FINANCIAL_PORTFOLIO_BARS,
} from "./mockFinanceData";
import financeService, { FinancialReportsResponse } from "../../services/financeService";

const FinanceFinancialReportsPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Oct 2025 – Sep 2026");
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [selectedOfficer, setSelectedOfficer] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<FinancialReportsResponse | null>(null);

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await financeService.getFinancialReports();
        if (data) setReportsData(data);
      } catch {
        // Fallback
      }
    };
    fetchReports();
  }, []);

  const reportsList = reportsData?.reportsList || FINANCIAL_REPORTS_LIST;
  const portfolioBars = reportsData?.portfolioBars || FINANCIAL_PORTFOLIO_BARS;

  const filteredReports = reportsList.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.generatedBy.toLowerCase().includes(q) ||
      r.format.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    setFeedbackMsg("Summary analytics deck exported in selected format.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleNewAction = () => {
    setFeedbackMsg("Report generation wizard launched.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDownloadReport = async (report: FinancialReportItem) => {
    setFeedbackMsg(`Downloading "${report.name}" (${report.format})...`);
    try {
      await financeService.downloadReport(report.id, report.format);
    } catch {
      // Handled
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
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
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Financial Reports & Analytics
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Financial reports · As at 10 Oct 2026
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
                  <option value="Oct 2025 – Sep 2026">Date range</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 90 days">Last 90 days</option>
                  <option value="Current fiscal year">Current fiscal year</option>
                </select>

                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">School</option>
                  <option value="Greenfield">Greenfield International</option>
                  <option value="Crestview">Crestview Academy</option>
                  <option value="Rosehill">Rosehill College</option>
                </select>

                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Loan officer</option>
                  <option value="A. Musa">A. Musa</option>
                  <option value="M. James">M. James</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#700936]"
                >
                  <option value="All">Status</option>
                  <option value="Active">Active</option>
                  <option value="Settled">Settled</option>
                  <option value="Audited">Audited</option>
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

            {/* 4 Metric Cards (Image 4 & 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Total disbursed</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦851.0M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Oct 2025 – Sep 2026
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Repayments received</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦658.0M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Confirmed and matched
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Outstanding balance</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₦412.5M</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Active loan snapshot
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Collection rate</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">86.4%</div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Against scheduled collections
                </span>
              </div>
            </div>

            {/* Portfolio Performance Bar Chart Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Portfolio performance</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Monthly disbursement and repayment activity · 12 months
                </p>
              </div>

              {/* Legend & Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-2">
                <span className="font-semibold text-gray-800">Disbursements vs repayments</span>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#851342] inline-block" />
                    <span className="text-gray-600 text-[11px]">Disbursed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#a4c2db] inline-block" />
                    <span className="text-gray-600 text-[11px]">Repaid</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FINANCIAL_PORTFOLIO_BARS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      tickFormatter={(val) => `₦${val / 1000000}M`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`₦${(val / 1000000).toFixed(1)}M`, ""]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="disbursed" fill="#851342" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="repaid" fill="#a4c2db" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Available Reports Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-gray-900">Available reports</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search available reports..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Report</th>
                      <th className="py-3 px-4">Coverage</th>
                      <th className="py-3 px-4">Last generated</th>
                      <th className="py-3 px-4">Generated by</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-gray-900">
                          {report.name}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">{report.coverage}</td>
                        <td className="py-3.5 px-4 text-gray-500">{report.lastGenerated}</td>
                        <td className="py-3.5 px-4 text-gray-700">{report.generatedBy}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">{report.format}</td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadReport(report)}
                            className="px-3 py-1 bg-[#fdf0f4] text-[#851342] border border-[#fbcdd9] rounded-lg text-[11px] font-semibold hover:bg-[#fce7ee] transition-colors"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceFinancialReportsPage;
