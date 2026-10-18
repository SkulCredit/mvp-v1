import React from "react";
import { ArrowRight } from "lucide-react";
import { SCHOOL_PERFORMANCE } from "../mockFinanceData";
import { SchoolPerformanceRecord } from "../types";

interface Props {
  schools?: SchoolPerformanceRecord[];
}

const FinanceSchoolPerformance: React.FC<Props> = ({ schools = SCHOOL_PERFORMANCE }) => {
  const data = schools && schools.length > 0 ? schools : SCHOOL_PERFORMANCE;

  const getVerificationBadge = (status: SchoolPerformanceRecord["verificationStatus"]) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7ed] text-[#127a3c] border border-[#c1ebd0]">
            Verified
          </span>
        );
      case "On-site Verified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef6e7] text-[#9a6700] border border-[#fbe4b4]">
            On-site Verified
          </span>
        );
      case "Action Required":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf0f4] text-[#b91c1c] border border-[#fbcdd9]">
            Action Required
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100/90 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-900">School performance</h3>
        <button
          type="button"
          className="text-xs font-semibold text-[#700936] hover:text-[#58072a] flex items-center gap-1 transition-colors"
        >
          <span>Open schools & loan records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-5 sm:px-6">School</th>
              <th className="py-3 px-4">Bank account</th>
              <th className="py-3 px-4">Total disbursed</th>
              <th className="py-3 px-4">Outstanding</th>
              <th className="py-3 px-4 min-w-[130px]">Collection rate</th>
              <th className="py-3 px-5 sm:px-6 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50/70 transition-colors"
              >
                <td className="py-3.5 px-5 sm:px-6">
                  <div className="font-semibold text-gray-900 leading-snug">
                    {item.schoolName}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {item.schoolCode}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                  {item.bankAccount}
                </td>
                <td className="py-3.5 px-4 font-bold text-gray-900">
                  {item.totalDisbursed}
                </td>
                <td className="py-3.5 px-4 font-bold text-gray-800">
                  {item.outstanding}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-16 h-1.5 rounded-full bg-pink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#700936]"
                        style={{ width: `${item.collectionRate}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-700 text-[11px]">
                      {item.collectionRate}%
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-5 sm:px-6 text-right">
                  {getVerificationBadge(item.verificationStatus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceSchoolPerformance;
