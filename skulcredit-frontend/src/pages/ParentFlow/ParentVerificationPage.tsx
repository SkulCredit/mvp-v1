import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";

// ── Types 

type VerificationStatus = "verified" | "unverified";

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: VerificationStatus;
  detail?: string;
  note?: string;
  requiredForApplication?: boolean;
}

// ── Icons 

const MarkedIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img src="/marked-icon.svg" alt="" aria-hidden="true" className={className} />
);

const PhoneIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

// ── Page ─

const ParentVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const verifications: VerificationItem[] = [
    {
      id: "email",
      title: "Email Verification",
      description: "Your email was verified when you signed up",
      status: "verified",
      detail: user?.email ?? "—",
    },
    {
      id: "phone",
      title: "Phone Number Verification",
      description: "Verify your phone number for SMS notifications and security",
      status: "unverified",
    },
    {
      id: "identity",
      title: "Identity Verification (BVN/NIN)",
      description: "Complete BVN or NIN verification during your loan application",
      status: "unverified",
      note: "Identity verification is completed in Step 4 of the application form. This is required to process your loan request.",
      requiredForApplication: true,
    },
  ];

  const verifiedCount = verifications.filter((v) => v.status === "verified").length;
  const total = verifications.length;
  const progressPct = Math.round((verifiedCount / total) * 100);

  const whyItems = [
    { icon: "check-circle", color: "text-green-500", bg: "bg-green-50",   title: "Higher Approval Rate", desc: "Verified accounts are 3x more likely to get approved" },
    { icon: "clock",        color: "text-blue-500",  bg: "bg-blue-50",    title: "Faster Processing",    desc: "Applications process up to 50% faster" },
    { icon: "lock",         color: "text-purple-500",bg: "bg-purple-50",  title: "Enhanced Security",    desc: "Protect your account from unauthorized access" },
    { icon: "file-text",    color: "text-orange-500",bg: "bg-orange-50",  title: "Better Loan Terms",    desc: "Access to more favorable rates and limits" },
  ];

  return (
    <div className="flex flex-col gap-4 pt-8 animate-fade-in-up w-[85%] mx-auto pb-12">

      {/* ── Page heading ──────────*/}
      <div className="mb-1">
        <h2 className="text-xl font-extrabold text-gray-900">Verification</h2>
        <p className="mt-0.5 text-sm text-gray-400">Manage your identity and account verifications</p>
      </div>

      {/* ── Progress card ─────────*/}
      <div className="bg-white rounded-2xl border-2 border-brand/30 px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <ShieldIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Verification Progress</p>
              <p className="text-xs text-slate-500 mt-0.5">{verifiedCount} of {total} verifications completed</p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
            {progressPct}%
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-blue-700">Why verify?</span>{" "}
            Verified accounts have higher approval rates and faster processing times. Complete all verifications to unlock full platform benefits.
          </p>
        </div>
      </div>

      {/* ── Verification item cards */}
      {verifications.map((item) => {
        const isVerified = item.status === "verified";
        const isIdentity = item.id === "identity";
        const isPhone = item.id === "phone";

        return (
          <div
            key={item.id}
            className={`rounded-2xl border px-6 py-5 flex items-center justify-between gap-4 ${
              isVerified ? "bg-[#F0FDF4] border-green-200" : "bg-white border-slate-200"
            }`}
          >
            {/* Left: icon + text */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Circle icon */}
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isVerified
                    ? "bg-green-100 text-green-600"
                    : isPhone
                      ? "bg-slate-100 text-slate-500"
                      : "bg-green-100 text-green-600"
                }`}
              >
                {isVerified || isIdentity ? (
                  <MarkedIcon className="w-10 h-10" />
                ) : (
                  <PhoneIcon />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800">{item.title}</span>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.236 4.53L7.53 9.96a.75.75 0 0 0-1.06 1.062l2.25 2.25a.75.75 0 0 0 1.275-.257l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  {item.requiredForApplication && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-orange-300 text-orange-600 bg-white">
                      Required for Application
                    </span>
                  )}
                </div>
                {item.detail && (
                  <p className="text-xs text-slate-600 font-medium mb-0.5">{item.detail}</p>
                )}
                <p className="text-xs text-slate-500">{item.description}</p>
                {item.note && (
                  <p className="text-xs text-slate-400 mt-1">{item.note}</p>
                )}
              </div>
            </div>

            {/* Right: action */}
            <div className="shrink-0">
              {isVerified ? (
                <MarkedIcon className="w-8 h-8" />
              ) : isIdentity ? (
                <button
                  onClick={() => navigate("/parent/eligibility")}
                  className="inline-flex items-center bg-brand text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm whitespace-nowrap"
                >
                  Start Application
                </button>
              ) : (
                <button className="inline-flex items-center bg-brand text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm">
                  Verify
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Why Verification Matters  */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-brand">
            <ShieldIcon />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Why Verification Matters</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Completing all verifications helps us serve you better and improves your loan application success rate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {whyItems.map((w) => (
            <div key={w.title} className="rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${w.bg}`}>
                <Icon name={w.icon} className={`w-5 h-5 ${w.color}`} />
              </div>
              <p className="text-xs font-bold text-slate-800">{w.title}</p>
              <p className="text-xs text-slate-500">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentVerificationPage;
