import React, { useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  DashboardTopBar,
  SchoolSidebar,
} from "../../components/layout";

type SettingsTab = "settings" | "verification" | "support";

const TAB_META: { tab: SettingsTab; icon: string; label: string }[] = [
  { tab: "settings", icon: "settings", label: "Profile Settings" },
  { tab: "verification", icon: "shield-check", label: "Verification Status" },
  { tab: "support", icon: "headphones", label: "Help & Support" },
];

const SchoolVerificationSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("settings");

  return (
    <DashboardLayout
      sidebar={<SchoolSidebar />}
      header={<DashboardTopBar notificationCount={1} />}
      bgDecorations={
        <>
          <div className="fixed top-[10%] left-[20%] w-[40vw] h-[40vw] bg-rose-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="fixed bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-emerald-200/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        </>
      }
    >
      <div className="max-w-[1000px] mx-auto space-y-8 pt-6">
        {/* Page title + tab strip */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
            {TAB_META.find((t) => t.tab === activeTab)?.label}
          </h1>
          <div className="flex gap-8 border-b border-slate-300/50 mb-8 overflow-x-auto">
            {TAB_META.map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === tab ? "text-brand border-b-2 border-brand" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Icon name={icon} className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ SETTINGS ═══ */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Account Information
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Update your administrative contact details and security
              preferences.
            </p>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    School Admin Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Administrator"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm font-medium shadow-sm text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    Email Address
                    <span className="text-xs text-brand font-medium">
                      Locked (Contact Support to edit)
                    </span>
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@fosterprime.edu.ng"
                    readOnly
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-100/50 border border-slate-200 outline-none text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Primary Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+234-803 123 4567"
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm font-medium shadow-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Secondary Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm font-medium shadow-sm text-slate-800"
                  />
                </div>
                <div className="md:col-span-2 pt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Security
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input
                      type="password"
                      defaultValue="********"
                      readOnly
                      className="w-full px-5 py-3.5 rounded-2xl bg-slate-100/50 border border-slate-200 outline-none text-sm tracking-widest text-slate-500 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 hover:border-brand text-slate-700 hover:text-brand font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Icon name="lock" className="w-4 h-4" /> Change Password
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-8 mt-6 border-t border-slate-200/60 flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-brand to-brand-light text-white font-bold py-3.5 px-8 rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                  <Icon name="save" className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══ VERIFICATION ═══ */}
        {activeTab === "verification" && (
          <>
            <div className="bg-white rounded-[2rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-200/50 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Icon name="check-circle-2" className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Fully Verified
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md">
                      Tier 1 Partner
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    Your institution is authorized to receive instant
                    disbursements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Icon name="building-2" className="w-5 h-5 text-brand" />{" "}
                  Registered Details
                </h3>
                <button className="text-brand font-bold text-sm flex items-center gap-1 hover:underline">
                  Request Update{" "}
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Official Name", value: "Foster Prime Schools" },
                  {
                    label: "Physical Address",
                    value: "123 Education Avenue, Lagos",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-200/50"
                  >
                    <span className="text-sm font-bold text-slate-500">
                      {item.label}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-4 pt-2">
                  Compliance Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Registration Certificate",
                    "Accreditation Letter",
                    "CAC Certification",
                    "State Certification",
                  ].map((doc) => (
                    <div
                      key={doc}
                      className="bg-white/50 border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                    >
                      <Icon
                        name="check-circle"
                        className="w-5 h-5 text-emerald-500"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {doc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <Icon name="landmark" className="w-5 h-5 text-brand" />{" "}
                Settlement Account
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                      Guaranty Trust Bank
                    </p>
                    <p className="text-2xl font-black text-slate-900 tracking-widest font-mono">
                      0123456789
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                    <Icon name="lock" className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                    Account Name
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    Foster Prime Schools
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium max-w-sm">
                  Settlement accounts are locked to prevent fraud. Modifications
                  require a manual security check.
                </p>
                <button className="bg-white border border-slate-200 hover:border-brand text-slate-700 hover:text-brand font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm text-sm whitespace-nowrap">
                  Request Bank Change
                </button>
              </div>
            </div>
          </>
        )}

        {/* ═══ SUPPORT ═══ */}
        {activeTab === "support" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              {[
                {
                  icon: "plus-circle",
                  label: "Open Ticket",
                  sub: "Report a specific issue",
                  primary: true,
                },
                {
                  icon: "book-open",
                  label: "Help Center",
                  sub: "Read FAQs and guides",
                  primary: false,
                },
                {
                  icon: "message-square",
                  label: "Live Chat",
                  sub: "Talk to an agent now",
                  primary: false,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`p-6 rounded-[2rem] flex flex-col items-start gap-4 hover:-translate-y-1 transition-all group text-left ${item.primary ? "bg-gradient-to-br from-brand to-brand-light text-white shadow-[0_8px_16px_rgba(136,19,55,0.2)]" : "bg-white border border-slate-200 shadow-sm"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.primary ? "bg-white/20" : "bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand"}`}
                  >
                    <Icon name={item.icon} className="w-6 h-6" />
                  </div>
                  <div>
                    <span
                      className={`font-extrabold text-base block mb-1 ${item.primary ? "text-white" : "text-slate-900"}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-medium ${item.primary ? "text-brand-50" : "text-slate-500"}`}
                    >
                      {item.sub}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Ticket History
                </h2>
                <button className="text-sm font-bold text-brand hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    num: "#104",
                    title: "Disbursement Delay Inquiry",
                    time: "Updated 2 hours ago",
                    status: "Open",
                    open: true,
                  },
                  {
                    num: "#082",
                    title: "Update Bank Details",
                    time: "Resolved on 10 Nov",
                    status: "Closed",
                    open: false,
                  },
                ].map((ticket) => (
                  <div
                    key={ticket.num}
                    className={`bg-white/80 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand/30 transition-colors cursor-pointer ${!ticket.open ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${ticket.open ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        {ticket.num}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {ticket.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg ${ticket.open ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {ticket.status}
                      </span>
                      <Icon
                        name="chevron-right"
                        className="w-4 h-4 text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SchoolVerificationSettingsPage;
