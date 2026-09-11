import React from "react";
import Icon from "../../components/Icon";

const ParentRepaymentPage: React.FC = () => (
  <div className="space-y-6 pt-8 animate-fade-in-up w-[90%] mx-auto pb-12">
    <div>
      <h2 className="text-xl font-extrabold text-slate-900">Repayment</h2>
      <p className="mt-0.5 text-sm text-gray-400">View and manage your active repayment schedules</p>
    </div>

    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center py-16">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
        <Icon name="credit-card" className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-700">No active repayment schedules</h3>
      <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
        Once an application is approved and disbursed, your EMI schedule will appear here.
      </p>
    </div>
  </div>
);

export default ParentRepaymentPage;
