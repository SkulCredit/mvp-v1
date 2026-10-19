import React from "react";
import { PORTFOLIO_STATUS } from "../mockFinanceData";
import { PortfolioCategory } from "../types";

interface Props {
  portfolioStatus?: PortfolioCategory[];
}

const FinanceLoanPortfolio: React.FC<Props> = ({ portfolioStatus = PORTFOLIO_STATUS }) => {
  const data = portfolioStatus && portfolioStatus.length > 0 ? portfolioStatus : PORTFOLIO_STATUS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-gray-900">Loan portfolio status</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">2,184 applications</p>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">{item.status}</span>
              <span className="font-bold text-gray-900 text-[11px]">
                {item.count.toLocaleString()} · {item.percentage}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 rounded-full bg-pink-50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceLoanPortfolio;
