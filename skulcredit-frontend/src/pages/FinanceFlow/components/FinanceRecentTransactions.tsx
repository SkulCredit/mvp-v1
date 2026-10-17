import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { RECENT_TRANSACTIONS } from "../mockFinanceData";
import { FinanceTransaction } from "../types";

interface Props {
  searchQuery?: string;
}

const FinanceRecentTransactions: React.FC<Props> = ({ searchQuery = "" }) => {
  const [selectedTx, setSelectedTx] = useState<FinanceTransaction | null>(null);

  const filtered = RECENT_TRANSACTIONS.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.schoolOrParent.toLowerCase().includes(q) ||
      tx.loanOrAppId.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (tx: FinanceTransaction) => {
    switch (tx.statusVariant) {
      case "green":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            {tx.status}
          </span>
        );
      case "yellow":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            {tx.status}
          </span>
        );
      case "red":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            {tx.status}
          </span>
        );
      case "gray":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            {tx.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-900">Recent transactions</h3>
        <button
          type="button"
          onClick={() => setSelectedTx(RECENT_TRANSACTIONS[0])}
          className="text-xs font-semibold text-[#700936] hover:text-[#58072a] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-5 sm:px-6">ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">School / parent</th>
              <th className="py-3 px-4">Loan / application</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">18 Oct 2026</th>
              <th className="py-3 px-5 sm:px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {filtered.map((tx, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedTx(tx)}
                className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-5 sm:px-6 font-semibold text-gray-900 group-hover:text-[#700936]">
                  {tx.id}
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-600">
                  {tx.type}
                </td>
                <td className="py-3.5 px-4 font-medium text-gray-800">
                  {tx.schoolOrParent}
                </td>
                <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                  {tx.loanOrAppId}
                </td>
                <td className="py-3.5 px-4 font-bold text-gray-900">
                  ₦{tx.amount.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                  {tx.date}
                </td>
                <td className="py-3.5 px-5 sm:px-6 text-right">
                  {getStatusBadge(tx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Transaction Audit Record
                </span>
                <h4 className="font-bold text-gray-900 text-sm">{selectedTx.id}</h4>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Operation Type</span>
                <span className="font-semibold text-gray-900">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Entity</span>
                <span className="font-semibold text-gray-900">{selectedTx.schoolOrParent}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Loan / Application Ref</span>
                <span className="font-mono text-gray-800">{selectedTx.loanOrAppId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-lg text-[#700936]">
                  ₦{selectedTx.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Settlement Date</span>
                <span className="text-gray-800">{selectedTx.date}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Status</span>
                <div>{getStatusBadge(selectedTx)}</div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceRecentTransactions;
