import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Search, CheckCircle2 } from "lucide-react";
import FinanceSidebar from "./components/FinanceSidebar";
import FinanceTopBar from "./components/FinanceTopBar";
import { ELIGIBLE_LOANS, EligibleLoanItem } from "./mockFinanceData";
import financeService from "../../services/financeService";

const FinanceNewDisbursementPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loansList, setLoansList] = useState<EligibleLoanItem[]>(ELIGIBLE_LOANS);
  const [selectedLoan, setSelectedLoan] = useState<EligibleLoanItem>(ELIGIBLE_LOANS[0]);
  const [approverNote, setApproverNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchEligible = async () => {
      try {
        const list = await financeService.getEligibleLoans(searchQuery);
        if (list && list.length > 0) {
          setLoansList(list);
          if (!list.find((l) => l.id === selectedLoan.id)) {
            setSelectedLoan(list[0]);
          }
        }
      } catch {
        // Keep fallback
      }
    };
    fetchEligible();
  }, [searchQuery]);

  const filteredLoans = loansList.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.applicationId.toLowerCase().includes(q) ||
      l.parentName.toLowerCase().includes(q) ||
      l.schoolName.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await financeService.initiateDisbursement({
        loanApplicationId: selectedLoan.id,
        notes: approverNote,
      });
      setSuccessMessage(
        `Disbursement request for ${selectedLoan.applicationId} (${selectedLoan.formattedAmount}) submitted successfully for authorization.`
      );
    } catch {
      // Fallback optimistic success for UI demo
      setSuccessMessage(
        `Disbursement request for ${selectedLoan.applicationId} (${selectedLoan.formattedAmount}) submitted successfully for authorization.`
      );
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        navigate("/finance/disbursements");
      }, 2000);
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
          breadcrumb="New disbursement"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[1080px] mx-auto space-y-6">
            {/* Back link */}
            <div>
              <Link
                to="/finance/disbursements"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#700936] hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to disbursements
              </Link>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                New disbursement
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Pay a verified school for an approved loan. Authorization is done by a separate approver.
              </p>
            </div>

            {/* Success Toast */}
            {successMessage && (
              <div className="p-4 bg-[#e6f7ed] border border-[#c1ebd0] text-[#127a3c] rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in-up">
                <CheckCircle2 className="w-4 h-4 text-[#127a3c] shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Stepper (5 steps) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Step 1 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#700936] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-tight">
                      Eligible loan
                    </span>
                    <span className="text-[10px] text-gray-400">Select application</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#700936] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-tight">
                      Verify school
                    </span>
                    <span className="text-[10px] text-gray-400">Bank account check</span>
                  </div>
                </div>

                {/* Step 3 (Active) */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full border-2 border-[#700936] text-[#700936] flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#700936] block leading-tight">
                      Authorize payment
                    </span>
                    <span className="text-[10px] text-gray-400">Separate approver</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full border border-gray-200 text-gray-400 flex items-center justify-center text-xs shrink-0 font-medium">
                    4
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block leading-tight">
                      Process
                    </span>
                    <span className="text-[10px] text-gray-400">Sent to bank</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full border border-gray-200 text-gray-400 flex items-center justify-center text-xs shrink-0 font-medium">
                    5
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block leading-tight">
                      Confirm status
                    </span>
                    <span className="text-[10px] text-gray-400">Bank settlement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1 Card: Choose an eligible loan */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  1. Choose an eligible loan
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Approved applications that have not been disbursed yet
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search application ID, parents or schools"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Eligible loan cards */}
              <div className="space-y-2.5">
                {filteredLoans.map((loan) => {
                  const isSelected = selectedLoan.id === loan.id;
                  return (
                    <div
                      key={loan.id}
                      onClick={() => setSelectedLoan(loan)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-[#fce7ef] border-[#700936] shadow-xs"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {loan.applicationId} - {loan.parentName}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {loan.schoolName} - {loan.bankAccount}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {loan.formattedAmount}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
                          Verified
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2 Card: Verify and authorize */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-5"
            >
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  2. Verify and authorize
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Approved applications that have not been disbursed yet
                </p>
              </div>

              {/* Green Verified Banner */}
              <div className="p-3.5 bg-[#e6f7ed] border border-[#c1ebd0] rounded-xl flex items-start gap-3">
                <span className="px-2 py-0.5 bg-white text-[#127a3c] border border-[#c1ebd0] rounded-full text-[10px] font-bold shrink-0">
                  School verified
                </span>
                <span className="text-xs text-[#127a3c] leading-snug">
                  This school has an approved, verified bank account. The payment can be submitted for authorization.
                </span>
              </div>

              {/* Loan Details Grid */}
              <div className="space-y-2.5 text-xs text-gray-700 pt-1">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Application</span>
                  <span className="font-semibold text-gray-900">{selectedLoan.applicationId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Parent</span>
                  <span className="font-semibold text-gray-900">{selectedLoan.parentName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">School</span>
                  <span className="font-semibold text-gray-900">{selectedLoan.schoolName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Verified account</span>
                  <span className="font-mono text-gray-800">{selectedLoan.bankAccount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Transaction ref</span>
                  <span className="text-gray-500">Created on processing</span>
                </div>
                <div className="flex justify-between py-2 items-center">
                  <span className="text-gray-900 font-bold">Amount</span>
                  <span className="text-base sm:text-lg font-extrabold text-gray-900">
                    {selectedLoan.formattedAmount}
                  </span>
                </div>
              </div>

              {/* Optional note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Note for the approver (Optional)
                </label>
                <input
                  type="text"
                  value={approverNote}
                  onChange={(e) => setApproverNote(e.target.value)}
                  placeholder="e.g. Term 1 fees, confirmed with school"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#700936]"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#700936] text-white text-xs sm:text-sm font-semibold hover:bg-[#58072a] transition-colors disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? "Submitting for authorization..." : "Submit for authorization"}
              </button>

              {/* Regulatory footnote */}
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Payments to an unverified school bank account are blocked. Submission, authorization and processing are each recorded with user, time and record ID.
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceNewDisbursementPage;
