import React, { useState } from "react";
import { Search, Download, Plus, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import {
  SCHOOL_DIRECTORY_DATA,
  SchoolDirectoryItem,
  LINKED_LOANS_DATA,
} from "./mockFinanceData";

const FinanceSchoolRecordsPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [loanSearchQuery, setLoanSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredSchools = SCHOOL_DIRECTORY_DATA.filter((s) => {
    const matchesSearch =
      !schoolSearchQuery ||
      s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.bankAccount.toLowerCase().includes(schoolSearchQuery.toLowerCase());
    const matchesVerification =
      verificationFilter === "All" || s.verification === verificationFilter;
    return matchesSearch && matchesVerification;
  });

  const filteredLoans = LINKED_LOANS_DATA.filter((l) => {
    if (!loanSearchQuery) return true;
    const q = loanSearchQuery.toLowerCase();
    return (
      l.loanId.toLowerCase().includes(q) ||
      l.applicationId.toLowerCase().includes(q) ||
      l.schoolName.toLowerCase().includes(q) ||
      l.parentName.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    setFeedbackMsg("School directory and linked portfolio report exported successfully.");
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenInvestigation = () => {
    setFeedbackMsg("Investigation ticket #INV-9924 created and routed to Bank Settlement Desk.");
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const getVerificationBadge = (v: SchoolDirectoryItem["verification"]) => {
    switch (v) {
      case "Verified":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            Verified
          </span>
        );
      case "Re-verify":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
            Re-verify
          </span>
        );
      case "Blocked":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
            Blocked
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            Pending
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
          breadcrumb="Schools & loan records"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Schools & Loan Records
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Schools & loan records · As at 18 Oct 2026
              </p>
            </div>

            {/* Notification */}
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

            {/* Filter Dropdowns Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white focus:outline-none"
                >
                  <option value="All">School verification (All)</option>
                  <option value="Verified">Verified</option>
                  <option value="Re-verify">Re-verify</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Pending">Pending</option>
                </select>

                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white focus:outline-none">
                  <option>Region (All)</option>
                  <option>Lagos Central</option>
                  <option>Lagos Mainland</option>
                  <option>Abuja / FCT</option>
                </select>

                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white focus:outline-none">
                  <option>Loan status (All)</option>
                  <option>Active</option>
                  <option>Overdue</option>
                </select>

                <select className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white focus:outline-none">
                  <option>Disbursement period</option>
                  <option>Current Term</option>
                  <option>Q3 2026</option>
                  <option>Q2 2026</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackMsg("Action modal opened.")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#9b0d4d] text-white text-xs font-semibold hover:bg-[#800a3e] flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New action</span>
                </button>
              </div>
            </div>

            {/* 4 Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Registered schools</span>
                <div className="text-2xl font-extrabold text-gray-900">47</div>
                <span className="text-[10px] text-gray-400 mt-1 block">Across active pilot locations</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Verified bank accounts</span>
                <div className="text-2xl font-extrabold text-gray-900">42</div>
                <span className="text-[10px] text-gray-400 mt-1 block">5 require attention</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Total disbursed</span>
                <div className="text-2xl font-extrabold text-[#9b0d4d]">₦851.0M</div>
                <span className="text-[10px] text-gray-400 mt-1 block">Across school partners</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <span className="text-xs text-gray-400 block mb-1">Linked active loans</span>
                <div className="text-2xl font-extrabold text-gray-900">2,184</div>
                <span className="text-[10px] text-gray-400 mt-1 block">Current portfolio</span>
              </div>
            </div>

            {/* Section 1: School directory */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">School directory</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    School verification, bank details and linked loan portfolio
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export directory
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackMsg("Add school modal opened.")}
                    className="px-3 py-1.5 bg-[#9b0d4d] text-white rounded-xl text-xs font-semibold hover:bg-[#800a3e]"
                  >
                    + Add school
                  </button>
                </div>
              </div>

              {/* Functional Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  placeholder="Search school name, code or account..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#9b0d4d]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">School / ID</th>
                      <th className="py-3 px-4">Bank account</th>
                      <th className="py-3 px-4">Total disbursed</th>
                      <th className="py-3 px-4">Outstanding</th>
                      <th className="py-3 px-4">Collection rate</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSchools.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6">
                          <span className="font-semibold text-gray-900 block">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{item.code}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                          {item.bankAccount}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{item.totalDisbursed}</td>
                        <td className="py-3.5 px-4 text-gray-700 font-semibold">{item.outstanding}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">{item.collectionRate}%</td>
                        <td className="py-3.5 px-4">{getVerificationBadge(item.verification)}</td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setFeedbackMsg(`Viewing records for ${item.name}`)}
                            className="px-2.5 py-1 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-white"
                          >
                            {item.verification === "Re-verify" || item.verification === "Blocked"
                              ? "Review"
                              : "View"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Selected transaction details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Selected transaction details
              </h3>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-gray-900 block">
                    TXN-009823 · Parent repayment · LN-22071
                  </span>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1.5 text-gray-500">
                    <span>
                      Expected amount: <strong className="text-gray-900">₦86,500</strong>
                    </span>
                    <span>
                      Settlement reference:{" "}
                      <strong className="text-amber-600 font-semibold">Not found</strong>
                    </span>
                    <span>
                      Recommended action:{" "}
                      <strong className="text-gray-800">Check providus settlement file</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenInvestigation}
                  className="px-3.5 py-2 rounded-xl bg-[#9b0d4d] text-white text-xs font-semibold hover:bg-[#800a3e] transition-colors shrink-0 shadow-2xs"
                >
                  Open investigation
                </button>
              </div>
            </div>

            {/* Section 3: Linked loan records */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Linked loan records</h3>
                <span className="text-xs text-gray-400">{filteredLoans.length} active records</span>
              </div>

              {/* Functional Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={loanSearchQuery}
                  onChange={(e) => setLoanSearchQuery(e.target.value)}
                  placeholder="Search loan ID, application or borrower..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#9b0d4d]"
                />
              </div>

              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">Loan ID</th>
                      <th className="py-3 px-4">Application</th>
                      <th className="py-3 px-4">School</th>
                      <th className="py-3 px-4">Parent</th>
                      <th className="py-3 px-4">Outstanding</th>
                      <th className="py-3 px-4">Repayment status</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-5 sm:px-6 font-mono font-bold text-gray-900">
                          {loan.loanId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                          {loan.applicationId}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">{loan.schoolName}</td>
                        <td className="py-3.5 px-4 text-gray-700">{loan.parentName}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{loan.outstanding}</td>
                        <td className="py-3.5 px-4 text-gray-700">{loan.repaymentAmount}</td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              loan.status === "Overdue"
                                ? "bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]"
                                : "bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]"
                            }`}
                          >
                            {loan.status}
                          </span>
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

export default FinanceSchoolRecordsPage;
