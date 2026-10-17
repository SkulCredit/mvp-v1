import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import { SCHOOL_VERIFICATION_ITEMS, SchoolVerificationItem } from "./mockFinanceData";

const FinanceSchoolVerificationPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"officer" | "approver">("officer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolVerificationItem>(
    SCHOOL_VERIFICATION_ITEMS[0]
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredSchools = SCHOOL_VERIFICATION_ITEMS.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.schoolName.toLowerCase().includes(q) ||
      s.schoolCode.toLowerCase().includes(q) ||
      s.bankAccount.toLowerCase().includes(q)
    );
  });

  const handleFlagReverification = () => {
    setFeedbackMsg(`Flag placed: Re-verification requested for ${selectedSchool.schoolName}. Verification team notified.`);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const getStatusBadge = (status: SchoolVerificationItem["status"]) => {
    switch (status) {
      case "Verified":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            Verified
          </span>
        );
      case "Re-verification due":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
            Re-verification due
          </span>
        );
      case "Pending review":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            Pending review
          </span>
        );
      case "Unverified":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            Unverified
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
          breadcrumb="School verification"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1240px] mx-auto space-y-6">
            {/* Header & Back */}
            <div>
              <Link
                to="/finance/disbursements"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#700936] hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to disbursements
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    School verification status
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Check whether each school's bank account is verified before paying. Finance can view and flag issues, not approve changes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("officer")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeRoleTab === "officer"
                        ? "bg-[#700936] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    Finance Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("approver")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeRoleTab === "approver"
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
                  Dismiss
                </button>
              </div>
            )}

            {/* 4 Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Processing</span>
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦2,900,000</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Completed</span>
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">
                    4
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦350,000,000</div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Failed</span>
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </div>
                <div className="text-xl font-extrabold text-gray-900">₦2,900,000</div>
              </div>

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

            {/* Schools Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Schools</h3>
                <span className="text-xs text-gray-400">7 of 7 schools</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="School search name or ID"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-5 sm:-mx-6 pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5 sm:px-6">School</th>
                      <th className="py-3 px-4">Bank account</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last verified</th>
                      <th className="py-3 px-4">Payments blocked</th>
                      <th className="py-3 px-5 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSchools.map((item, idx) => {
                      const isSelected = selectedSchool.id === item.id;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedSchool(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? "bg-[#fce7ef]" : "hover:bg-gray-50/70"
                          }`}
                        >
                          <td className="py-3.5 px-5 sm:px-6">
                            <span className="font-semibold text-gray-900 block">
                              {item.schoolName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {item.schoolCode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                            {item.bankAccount}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                          <td className="py-3.5 px-4 text-gray-500">{item.lastVerified}</td>
                          <td className="py-3.5 px-4 font-bold text-gray-800">
                            {item.issuesCount}
                          </td>
                          <td className="py-3.5 px-5 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSchool(item);
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
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {selectedSchool.schoolName}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {selectedSchool.schoolCode} · Account {selectedSchool.bankAccount}
                  </p>
                </div>
                <div>{getStatusBadge(selectedSchool.status)}</div>
              </div>

              {/* Status Banner (Screenshot 3) */}
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                  selectedSchool.status === "Verified"
                    ? "bg-[#e6f7ed] border-[#c1ebd0] text-[#127a3c]"
                    : selectedSchool.status === "Re-verification due"
                    ? "bg-[#fef9c3] border-[#fef08a] text-[#854d0e]"
                    : "bg-[#fdf0f4] border-[#fbcdd9] text-[#991b1b]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {selectedSchool.status === "Verified"
                    ? "No payments are affected. Disbursements to this school can proceed."
                    : selectedSchool.status === "Re-verification due"
                    ? "No payments are blocked right now. Periodic re-verification was due on 14 Oct 2026. Routing it to the verification team is recommended."
                    : "Approved loan cannot be disbursed until this school is verified. Account name on the bank record does not match the school name."}
                </span>
              </div>

              {/* Checklist */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-[#127a3c] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Bank account on file</span>
                    <span className="text-[11px] text-gray-400">Account number and bank recorded.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-[#127a3c] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Account name matches school</span>
                    <span className="text-[11px] text-gray-400">Name on the bank record matches.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  {selectedSchool.status === "Verified" ? (
                    <div className="w-4 h-4 rounded-full bg-[#127a3c] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                      —
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-gray-900 block">Reviewed by authorised team</span>
                    <span className="text-[11px] text-gray-400">Reviewed and approved.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-[#127a3c] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Supporting document on file</span>
                    <span className="text-[11px] text-gray-400">Document attached to the school record.</span>
                  </div>
                </div>
              </div>

              {/* Metadata rows */}
              <div className="space-y-1.5 pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Last verified</span>
                  <span className="text-gray-800">{selectedSchool.lastVerified}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Linked loans</span>
                  <span className="font-semibold text-gray-900">{selectedSchool.linkedLoansCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Payments blocked</span>
                  <span className="font-semibold text-gray-900">{selectedSchool.issuesCount}</span>
                </div>
              </div>

              {/* Action Buttons (Screenshot 3) */}
              <div className="pt-2 space-y-2">
                {selectedSchool.status === "Verified" ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-gray-400 text-xs font-semibold cursor-not-allowed"
                    >
                      No action needed
                    </button>
                    <button
                      type="button"
                      onClick={handleFlagReverification}
                      className="w-full py-2.5 rounded-xl bg-pink-50 border border-pink-200 text-[#700936] text-xs font-semibold hover:bg-pink-100 transition-colors"
                    >
                      Approved verification
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleFlagReverification}
                      className="w-full py-2.5 rounded-xl bg-[#851342] text-white text-xs font-semibold hover:bg-[#6e0f36] transition-colors"
                    >
                      Route verification issue
                    </button>
                    <button
                      type="button"
                      onClick={handleFlagReverification}
                      className="w-full py-2.5 rounded-xl bg-pink-50 border border-pink-200 text-[#700936] text-xs font-semibold hover:bg-pink-100 transition-colors"
                    >
                      Approved notification
                    </button>
                  </>
                )}
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Approving or changing bank details is reserved for the authorised verification team. Finance cannot approve its own changes.
                </p>
                <div className="text-center pt-1">
                  <Link
                    to="/finance/disbursements"
                    className="text-xs font-semibold text-[#700936] hover:underline"
                  >
                    View this school's disbursement →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceSchoolVerificationPage;
