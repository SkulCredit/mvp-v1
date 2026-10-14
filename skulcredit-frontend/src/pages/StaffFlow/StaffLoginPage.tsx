import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const STAFF_ROLES = ["customer_service", "customer_service_manager", "accountant", "risk_management"] as const;
type StaffRole = typeof STAFF_ROLES[number];

const ROLE_DASHBOARDS: Record<StaffRole, string> = {
  customer_service:         "/cs/dashboard",
  customer_service_manager: "/cs/dashboard",
  accountant:               "/cs/dashboard",
  risk_management:          "/cs/dashboard",
};

const StaffLoginPage: React.FC = () => {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();

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

      const role = user.role as string;
      const isStaff = STAFF_ROLES.includes(role as StaffRole);

      if (!isStaff) {
        throw new Error(
          role === "admin" || role === "super_admin"
            ? "Admin accounts must use the Admin Portal."
            : "This portal is for in-house staff accounts only.",
        );
      }

      const dashboard = ROLE_DASHBOARDS[role as StaffRole] ?? "/cs/dashboard";
      const next = params.get("next");
      navigate(next && next.startsWith("/cs") ? next : dashboard, { replace: true });
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
            Welcome to the<br />
            <span className="text-[#881337] font-extrabold">
              SkulCredit Staff Portal</span>
          </h1>
          <p className="text-slate-600 text-base max-w-sm leading-relaxed">
            Your dedicated workspace for managing customer support, operations, and more.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: "💬", label: "Customer Service",  desc: "Handle tickets & escalations" },
              { icon: "📊", label: "Risk Management",   desc: "Review loan risk & compliance"  },
              { icon: "🧾", label: "Accountant",        desc: "Manage disbursements & ledgers"  },
            ].map(item => (
              <div key={item.label}
                   className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ backgroundColor: "rgba(122,14,66,0.1)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7A0E42" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Staff Portal</p>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">Sign in to your account</h2>
              </div>
            </div>

            <p className="text-slate-500 text-sm mb-8">
              For Customer Service, Risk Management, Accountant, and other in-house staff.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0">
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
                  onChange={e => setEmail(e.target.value)}
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
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                           strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                           strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
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
                  className="text-sm font-semibold text-[#7A0E42] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide"
                style={{ backgroundColor: "#7A0E42" }}
                onMouseEnter={e => { if (!isLoading) (e.currentTarget.style.backgroundColor = "#5e0a31"); }}
                onMouseLeave={e => { if (!isLoading) (e.currentTarget.style.backgroundColor = "#7A0E42"); }}
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

            <p className="mt-6 flex items-center gap-1.5 text-sm text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              Need access?{" "}
              <span className="font-semibold text-slate-700">Contact your administrator.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
