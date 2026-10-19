import React from "react";
import { Info } from "lucide-react";

const FinanceCalculationFooter: React.FC = () => {
  return (
    <div className="bg-[#fef8fa] rounded-2xl border border-pink-100/90 p-5 sm:p-6 text-xs text-gray-600 leading-relaxed space-y-2">
      <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
        <Info className="w-3.5 h-3.5 text-[#700936]" />
        <h4>How these figures are calculated</h4>
      </div>

      <p className="text-[11px] text-gray-500">
        <strong className="text-gray-800 font-semibold">Total disbursed</strong> sums completed school payments in the selected period; reversed payments are excluded.{" "}
        <strong className="text-gray-800 font-semibold">Repayments received</strong> sums confirmed, matched parent payments in the same period.{" "}
        <strong className="text-gray-800 font-semibold">Outstanding balance</strong> is a point-in-time snapshot across all active loans and is not period-based. Balances update from confirmed transactions only; a transaction is reconciled only through a matched settlement record, never by a manual status change.
      </p>
    </div>
  );
};

export default FinanceCalculationFooter;
