import React, { useState } from "react";
import { CheckSquare, ArrowRight, X } from "lucide-react";
import { PENDING_ACTIONS } from "../mockFinanceData";
import { PendingAction } from "../types";

interface Props {
  actions?: PendingAction[];
}

const FinancePendingActions: React.FC<Props> = ({ actions = PENDING_ACTIONS }) => {
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const data = actions && actions.length > 0 ? actions : PENDING_ACTIONS;

  const handleActionClick = (action: PendingAction) => {
    setSelectedAction(action);
  };

  const handleResolve = () => {
    if (!selectedAction) return;
    setSuccessMsg(`Action "${selectedAction.title}" queue updated successfully.`);
    setSelectedAction(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-6 h-6 rounded-md bg-[#fce7ef] text-[#700936] flex items-center justify-center">
          <CheckSquare className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Pending actions</h3>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {data.map((item) => (
          <div
            key={item.id}
            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              {/* Pink number badge */}
              <div className="w-8 h-8 rounded-lg bg-[#fce7ef] text-[#700936] font-bold text-xs flex items-center justify-center shrink-0">
                {item.count}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900 leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => handleActionClick(item)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>{item.actionText}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Action Resolution Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#fce7ef] text-[#700936] font-bold text-xs flex items-center justify-center">
                  {selectedAction.count}
                </span>
                <h4 className="font-bold text-gray-900 text-sm">
                  {selectedAction.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              {selectedAction.subtitle}. Would you like to process and clear this batch queue now?
            </p>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 mb-5">
              <span className="font-semibold text-gray-700 block mb-1">Queue Audit:</span>
              Batch ID: BATCH-FIN-{selectedAction.count * 104} · Priority: High
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="px-4 py-2 bg-[#700936] text-white rounded-xl text-xs font-semibold hover:bg-[#58072a] transition-colors"
              >
                Execute {selectedAction.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePendingActions;
