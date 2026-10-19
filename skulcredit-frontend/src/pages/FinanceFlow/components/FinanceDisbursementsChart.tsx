import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_DATA_12_MONTHS, CHART_DATA_6_MONTHS } from "../mockFinanceData";
import { ChartDataPoint } from "../types";
import { BarChart3 } from "lucide-react";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-lg text-xs space-y-1">
        <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1">
          {label} 2026
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-xs"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-bold text-gray-900">₦{entry.value}M</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface Props {
  chartData?: ChartDataPoint[];
  onRangeChange?: (range: "6" | "12") => void;
}

const FinanceDisbursementsChart: React.FC<Props> = ({ chartData, onRangeChange }) => {
  const [range, setRange] = useState<"6" | "12">("12");

  const handleRange = (r: "6" | "12") => {
    setRange(r);
    if (onRangeChange) {
      onRangeChange(r);
    }
  };

  const data = chartData && chartData.length > 0
    ? chartData
    : range === "12"
    ? CHART_DATA_12_MONTHS
    : CHART_DATA_6_MONTHS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#fce7ef] text-[#700936] flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              Disbursements vs repayments
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 ml-8">
            Combined versus repayment schedules
          </p>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 ml-8 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#700936]" />
              <span className="text-gray-600 font-medium">Paid to schools</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#fbcfe8]" />
              <span className="text-gray-600 font-medium">Received from parents</span>
            </div>
          </div>
        </div>

        {/* 6M / 12M Pill Switcher */}
        <div className="flex items-center bg-gray-50 border border-gray-100 p-1 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => handleRange("6")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === "6"
                ? "bg-[#700936] text-white shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => handleRange("12")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === "12"
                ? "bg-[#700936] text-white shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `₦${v}M`}
              domain={[0, 800]}
              ticks={[0, 200, 400, 600, 800]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="paidToSchools"
              name="Paid to schools"
              fill="#700936"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />
            <Bar
              dataKey="receivedFromParents"
              name="Received from parents"
              fill="#fbcfe8"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceDisbursementsChart;
