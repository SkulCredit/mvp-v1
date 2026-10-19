import React, { useState } from "react";
import {
  Zap,
  Send,
  CreditCard,
  RefreshCw,
  FileSpreadsheet,
  X,
  CheckCircle2,
} from "lucide-react";

const FinanceQuickActions: React.FC = () => {
  const [modalType, setModalType] = useState<
    "disbursement" | "repayment" | "reconcile" | "report" | null
  >(null);

  const [notification, setNotification] = useState<string | null>(null);

  // Form states for modals
  const [disbursementForm, setDisbursementForm] = useState({
    school: "Greenfield International School",
    amount: "4250000",
    tranche: "Tranche 1/3 (Term 1)",
    notes: "",
  });

  const [repaymentForm, setRepaymentForm] = useState({
    parent: "Parent · A. Okoro",
    loanId: "LN-72071",
    amount: "85000",
    method: "Bank Transfer",
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDisbursementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalType(null);
    showToast(
      `Disbursement of ₦${Number(disbursementForm.amount).toLocaleString()} initiated for ${disbursementForm.school}. Awaiting L2 dual-authorization.`
    );
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalType(null);
    showToast(
      `Repayment of ₦${Number(repaymentForm.amount).toLocaleString()} recorded successfully for ${repaymentForm.parent}.`
    );
  };

  const handleReconcileSubmit = () => {
    setModalType(null);
    showToast("Automated transaction reconciliation completed: 142 records matched.");
  };

  const handleReportSubmit = () => {
    setModalType(null);
    showToast("Financial summary report generated and queued for download.");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-6 h-6 rounded-md bg-[#fce7ef] text-[#700936] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Quick actions</h3>
      </div>

      {notification && (
        <div className="mb-4 p-3 bg-[#e6f7ed] border border-[#c1ebd0] text-[#127a3c] rounded-xl text-xs flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#127a3c]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#127a3c] hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Stacked Action Buttons */}
      <div className="space-y-3">
        {/* Primary Action */}
        <button
          type="button"
          onClick={() => setModalType("disbursement")}
          className="w-full py-3 px-4 rounded-xl bg-[#700936] text-white text-xs sm:text-sm font-semibold hover:bg-[#58072a] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 text-pink-200" />
          <span>Initiate disbursement</span>
        </button>

        {/* Secondary Actions */}
        <button
          type="button"
          onClick={() => setModalType("repayment")}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 text-xs sm:text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4 text-gray-500" />
          <span>Record or review repayment</span>
        </button>

        <button
          type="button"
          onClick={() => setModalType("reconcile")}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 text-xs sm:text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Reconcile transactions</span>
        </button>

        <button
          type="button"
          onClick={() => setModalType("report")}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 text-xs sm:text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-gray-500" />
          <span>Generate report</span>
        </button>
      </div>

      {/* Footnote requirement text */}
      <p className="mt-4 text-[11px] text-gray-400 leading-relaxed font-normal">
        Disbursement validation for any school will require dual authorization from officers within 1 hr post initiative.
      </p>

      {/* --- Modals for Quick Actions --- */}

      {/* 1. Initiate Disbursement Modal */}
      {modalType === "disbursement" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-[#700936]" />
                Initiate School Disbursement
              </h4>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisbursementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Target School</label>
                <select
                  value={disbursementForm.school}
                  onChange={(e) => setDisbursementForm({ ...disbursementForm, school: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                >
                  <option>Greenfield International School</option>
                  <option>Crestview Academy</option>
                  <option>Rosehill College</option>
                  <option>Lakeside Preparatory</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Disbursement Amount (₦)</label>
                  <input
                    type="number"
                    value={disbursementForm.amount}
                    onChange={(e) => setDisbursementForm({ ...disbursementForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Tranche Schedule</label>
                  <input
                    type="text"
                    value={disbursementForm.tranche}
                    onChange={(e) => setDisbursementForm({ ...disbursementForm, tranche: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Authorized Settlement Note</label>
                <textarea
                  rows={2}
                  placeholder="Enter reference details for bank settlement file..."
                  value={disbursementForm.notes}
                  onChange={(e) => setDisbursementForm({ ...disbursementForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                ⚠️ Payout requires 2-factor confirmation from Finance Lead within 60 minutes.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#700936] text-white rounded-xl font-semibold hover:bg-[#58072a] transition-colors"
                >
                  Submit for Authorization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Record Repayment Modal */}
      {modalType === "repayment" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#700936]" />
                Record Manual Repayment
              </h4>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Parent / Student</label>
                <input
                  type="text"
                  value={repaymentForm.parent}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, parent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Loan Ref ID</label>
                  <input
                    type="text"
                    value={repaymentForm.loanId}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, loanId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Amount Paid (₦)</label>
                  <input
                    type="number"
                    value={repaymentForm.amount}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#700936]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#700936] text-white rounded-xl font-semibold hover:bg-[#58072a]"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reconcile Modal */}
      {modalType === "reconcile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#700936]" />
                Automated Transaction Reconciliation
              </h4>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Match pending gateway settlements against NIBSS and Providus bank statements for period 18 Oct 2026.
            </p>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span>Unmatched Bank Credits:</span>
                <span className="font-bold text-gray-800">19 entries</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Outflows:</span>
                <span className="font-bold text-gray-800">7 entries</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReconcileSubmit}
                className="px-4 py-2 bg-[#700936] text-white rounded-xl text-xs font-semibold hover:bg-[#58072a]"
              >
                Start Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Generate Report Modal */}
      {modalType === "report" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#700936]" />
                Generate Finance Report
              </h4>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Report Scope</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl">
                  <option>Comprehensive Disbursement & Repayment Summary</option>
                  <option>School Payout Ledger (CSV)</option>
                  <option>Overdue Collections & Aging Analysis</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">File Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="format" defaultChecked /> Excel (.xlsx)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="format" /> CSV (.csv)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="format" /> PDF Document
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                className="px-4 py-2 bg-[#700936] text-white rounded-xl text-xs font-semibold hover:bg-[#58072a]"
              >
                Export File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceQuickActions;
