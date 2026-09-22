import React, { useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { useAuth } from "../../context/AuthContext";

// ── Detail row ────────────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right">
      {value}
    </span>
  </div>
);

// ── Section card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
      <Icon name={icon} className="w-5 h-5 text-slate-500" />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

const DOCS = [
  "Registration Certificate",
  "Accreditation Letter",
  "CAC Certification",
  "State Certification",
];

// ── Page ──────────────────────────────────────────────────────────────────────
const SchoolVerificationSettingsPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const schoolName =
    user?.schoolName ?? user?.name ?? "Springfield High School";

  return (
    <DashboardLayout
      sidebar={
        <SchoolSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={<SchoolTopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />}
    >
      <div className="pt-8 space-y-5 animate-fade-in-up w-[90%] mx-auto">
        {/* Page header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">
              Partner School Verification
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 max-w-md">
              Review and manage tuition Track your verification progress and
              ensure your school information and documents are accurate n loan
              applications
            </p>

            {/* Status row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <Icon name="clock" className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Status:</p>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                </div>
                <div className="ml-8 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Last Updated:
                  </span>{" "}
                  15/01/2025
                </div>
              </div>
            </div>
          </div>

          {/* Illustration icon */}
          <div className="shrink-0 ml-4">
            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Icon name="clipboard-check" className="w-8 h-8 text-brand" />
            </div>
          </div>
        </div>

        {/* School Information */}
        <SectionCard icon="building" title="School Information">
          <Row label="Name:" value={schoolName} />
          <Row label="Address:" value="123 Education Avenue, Lagos, Nigeria" />
          <Row label="Name:" value={schoolName} />
          <Row label="Name:" value={schoolName} />

          {/* Documents */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Documents
            </p>
            <div className="space-y-2">
              {DOCS.map((doc) => (
                <div
                  key={doc}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <Icon
                    name="check-circle"
                    className="w-4 h-4 text-emerald-500 shrink-0"
                  />
                  {doc}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Bank Details */}
        <SectionCard icon="credit-card" title="Bank Details">
          <Row label="Bank Name:" value="Zenith Bank" />
          <Row label="Account Number" value="0123456789" />
          <Row label="Account Holder:" value="School Administrator" />
          <Row
            label="Verification Status"
            value={
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                Verified
                <Icon
                  name="check-circle"
                  className="w-4 h-4 text-emerald-500"
                />
              </span>
            }
          />
        </SectionCard>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <button className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] transition-colors">
              <Icon name="send" className="w-4 h-4" />
              Submit For Verification
            </button>
            <button className="flex items-center gap-2 border border-brand text-brand text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand/5 transition-colors">
              <Icon name="mail" className="w-4 h-4" />
              Contact Support
            </button>
          </div>

          {/* Notes */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Icon
              name="info"
              className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Notes</p>
              <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                <li>Estimated verification time: 1–3 days</li>
                <li>If rejected, check reason in your email.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolVerificationSettingsPage;
