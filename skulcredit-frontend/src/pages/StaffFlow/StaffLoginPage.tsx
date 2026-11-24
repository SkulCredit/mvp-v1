import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const STAFF_ROLES = [
  "customer_service",
  "customer_service_manager",
  "accountant",
  "risk_management",
] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const ROLE_DASHBOARDS: Record<string, string> = {
  customer_service: "/cs/dashboard",
  customer_service_manager: "/cs/dashboard",
  accountant: "/finance/dashboard",
  risk_management: "/cs/dashboard",
};

const StaffLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);

      const role = (user.role as string).toLowerCase();
      const isStaff = STAFF_ROLES.includes(role as StaffRole);

      if (!isStaff) {
        throw new Error(
          role === "admin" || role === "super_admin"
            ? "Admin accounts must use the Admin Portal."
            : "This portal is for in-house staff accounts only.",
        );
      }

      const dashboard = ROLE_DASHBOARDS[role] ?? "/cs/dashboard";
      const next = params.get("next");
      navigate(
        next && (next.startsWith("/cs") || next.startsWith("/finance"))
          ? next
          : dashboard,
        {
          replace: true,
        },
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err as Error)?.message ??
        "Invalid credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col bg-[#fce9f0] overflow-hidden">
        <span className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-[#f5c6d8]/60" />
        <span className="absolute bottom-[120px] left-[-60px] w-[200px] h-[200px] rounded-full bg-[#f5c6d8]/50" />
        <span className="absolute bottom-[-40px] left-[80px] w-[260px] h-[260px] rotate-12 bg-[#f5c6d8]/40 rounded-3xl" />

        <div className="relative z-10 p-10">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo_nav.png" alt="SkulCredit" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-20">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Welcome to the
            <br />
            <span className="text-[#881337] font-extrabold">
              SkulCredit Staff Portal
            </span>
          </h1>
          <p className="text-slate-600 text-base max-w-sm leading-relaxed">
            Your dedicated workspace for managing customer support, operations,
            and more.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              {
                icon: "💬",
                label: "Customer Service",
                desc: "Handle tickets & escalations",
              },
              {
                icon: "📊",
                label: "Risk Management",
                desc: "Review loan risk & compliance",
              },
              {
                icon: "🧾",
                label: "Accountant",
                desc: "Manage disbursements & ledgers",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <Link to="/" className="lg:hidden">
            <img src="/logo_nav.png" alt="SkulCredit" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[420px]">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(122,14,66,0.1)" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7A0E42"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                  Staff Portal
                </p>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  Sign in to your account
                </h2>
              </div>
            </div>

            <p className="text-slate-500 text-sm mb-8">
              For Customer Service, Risk Management, Accountant, and other
              in-house staff.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mt-0.5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="you@skulcredit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[18px] h-[18px]"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[18px] h-[18px]"
                      >
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm font-semibold text-[#7A0E42] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide"
                style={{ backgroundColor: "#7A0E42" }}
                onMouseEnter={(e) => {
                  if (!isLoading)
                    e.currentTarget.style.backgroundColor = "#5e0a31";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading)
                    e.currentTarget.style.backgroundColor = "#7A0E42";
                }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-slate-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
                Need help or access?
              </span>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="font-semibold text-[#7A0E42] hover:underline cursor-pointer"
              >
                Contact support
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowSupportModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-7 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#7A0E42]/10 text-[#7A0E42] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900">Staff & IT Support</h3>
            <p className="text-xs text-gray-500 mt-1">
              Need assistance with your staff portal account or credentials? Reach out to technical operations.
            </p>

            <div className="mt-5 space-y-3">
              <a
                href="mailto:support@skulcredit.com?subject=SkulCredit%20Staff%20Support%20Request"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-100/60 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">IT Help Desk Email</p>
                  <p className="text-[11px] text-gray-500 font-medium">support@skulcredit.com</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              <a
                href="tel:+2348007585273"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-100/60 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">Telephone Hotline</p>
                  <p className="text-[11px] text-gray-500 font-medium">+234 1 800 SKULCREDIT</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              <div className="p-3 rounded-xl bg-gray-50 text-[11px] text-gray-500 flex items-center justify-between">
                <span>Working Hours:</span>
                <span className="font-semibold text-gray-700">Mon – Fri · 8:00 AM – 6:00 PM WAT</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:support@skulcredit.com?subject=SkulCredit%20Staff%20Support%20Request"
                className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#7A0E42] hover:bg-[#5e0a31] transition-colors shadow-xs"
              >
                Send Email
              </a>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-7 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900">Staff Password Reset</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              For security compliance, staff passwords must be reset via your assigned system administrator or the IT Help Desk.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900">
              Please email <strong>support@skulcredit.com</strong> from your verified official staff email address with your staff ID and department to initiate a secure password reset.
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:support@skulcredit.com?subject=Staff%20Password%20Reset%20Request"
                className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#7A0E42] hover:bg-[#5e0a31] transition-colors shadow-xs"
              >
                Request Reset via Email
              </a>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLoginPage;
