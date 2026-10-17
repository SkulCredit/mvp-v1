import React from "react";
import { FINANCE_METRICS } from "../mockFinanceData";

const FinanceKPIStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {FINANCE_METRICS.map((metric) => (
        <div
          key={metric.id}
          className="bg-white rounded-2xl border border-gray-100/90 p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between"
        >
          <div>
            {/* Top row with icon badge and label */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-[#fce7ef] text-[#700936] flex items-center justify-center font-bold text-xs">
                ₦
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {metric.label}
              </span>
            </div>

            {/* Big Value */}
            <div className="text-2xl lg:text-[26px] font-extrabold tracking-tight text-gray-900">
              {metric.value}
            </div>
          </div>

          {/* Subtext */}
          <div className="mt-3 pt-2 text-[11px] text-gray-400 font-medium leading-relaxed border-t border-gray-50">
            {metric.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceKPIStats;
