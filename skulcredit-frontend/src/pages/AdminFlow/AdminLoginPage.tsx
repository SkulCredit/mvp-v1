import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import Icon from "../../components/Icon";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [remember, setRemember]   = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [error,            setError]            = useState("");
  const [isLoading,        setIsLoading]        = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal,  setShowForgotModal]  = useState(false);

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
      // Call /auth/login directly so we can inspect the raw response
      const res = await apiClient.post<{
        success: boolean;
        data: {
          requiresMfa?: boolean;
          user: { id: string; email: string; role: string };
          accessToken?: string;
        };
      }>("/auth/login", { email: email.trim(), password });

      const data = res.data.data;

      if (data.user.role !== "admin" && data.user.role !== "super_admin") {
        setError("Unauthorized. This portal is for administrator accounts only.");
        return;
      }

      if (data.requiresMfa) {
        // Backend already sent the OTP — redirect to OTP page
        navigate("/admin/auth/verify-otp", {
          state: { email: email.trim() },
          replace: true,
        });
        return;
      }

      // No 2FA — finalise the session via context (sets user + token in storage)
      const user = await login(email.trim(), password);
      void user;
      const next = params.get("next");
      navigate(next && next.startsWith("/admin") ? next : "/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Invalid credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans">

      {/* ── LEFT PANEL ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#fce4ef] overflow-hidden select-none">

        {/* Logo */}
        <div className="relative z-10 p-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo_nav.png" alt="SkulCredit" className="h-9 w-auto" />
          </Link>
        </div>

        {/* Diamond shapes — centered in lower half, behind the lady photo */}
        <img
          src="/Exclude.svg"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: "62%",
            bottom: "-15%",
            left: "0%",
            opacity: 0.75,
            zIndex: 5,
          }}
        />

        {/* Headline copy */}
        <div className="relative z-10 px-12 pt-2 max-w-[460px]">
          <h1 className="text-[2.6rem] font-bold text-slate-900 leading-[1.18]">
            Smarter education<br />
            financing for a{" "}
            <span className="text-[#881337] font-extrabold">brighter<br />future</span>
          </h1>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Empowering schools, parents, and students with flexible tuition financing and seamless school management.
          </p>
        </div>

        {/* Lady photo — positioned at bottom, full bleed */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end">
          <img
            src="/magnific__background.png"
            alt="Student working on laptop"
            className="w-full object-cover object-top"
            style={{ maxHeight: "58vh" }}
          />
        </div>

        {/* Italic tagline over image */}
        <div className="absolute bottom-8 right-8 z-20 text-right">
          <p className="text-sm italic text-[#881337]/70 leading-snug">
            Tuition today,<br />move possibilities<br />tomorrow
          </p>
          {/* decorative slash lines */}
          <svg width="32" height="20" viewBox="0 0 32 20" className="mt-1 ml-auto opacity-40" aria-hidden="true">
            <line x1="0" y1="20" x2="10" y2="0" stroke="#881337" strokeWidth="1.5"/>
            <line x1="11" y1="20" x2="21" y2="0" stroke="#881337" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white min-h-screen">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center px-6 pt-6 pb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <p className="text-slate-500 text-base mb-0.5 italic">Welcome to</p>
            <h2 className="text-[2rem] font-extrabold text-[#881337] leading-tight mb-2">
              Skulcredit Admin
            </h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Sign in to access your admin dashboard and manage applications, schools, and more.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <Icon name="alert-circle" className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address or username
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="Enter your email address or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm
                             text-slate-800 placeholder-slate-400 outline-none
                             focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-all"
                />
              </div>

              {/* Password */}
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm
                               text-slate-800 placeholder-slate-400 outline-none
                               focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPw ? "eye" : "eye-off"} className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  {/* Custom checkbox matching Figma filled pink square */}
                  <span
                    onClick={() => setRemember((v) => !v)}
                    role="checkbox"
                    aria-checked={remember}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === " " && setRemember((v) => !v)}
                    className={[
                      "w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors border",
                      remember
                        ? "bg-[#881337] border-[#881337]"
                        : "bg-white border-slate-300",
                    ].join(" ")}
                  >
                    {remember && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-slate-600">Remember</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm font-semibold text-[#881337] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-[#881337] text-white font-bold
                           py-3.5 rounded-xl hover:bg-[#6f0e2c] active:bg-[#5c0b24]
                           transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide"
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

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>

            </form>

            {/* Help */}
            <p className="mt-8 flex items-center gap-1.5 text-sm text-slate-500">
              <Icon name="help-circle" className="w-4 h-4 text-slate-400" />
              Need help?{" "}
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="font-semibold text-[#881337] hover:underline cursor-pointer"
              >
                Contact support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ── Support Modal ── */}
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

            <div className="w-12 h-12 rounded-2xl bg-[#fce4ef] text-[#881337] flex items-center justify-center mb-4">
              <Icon name="help-circle" className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">SkulCredit Support Desk</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Need assistance with your admin account, password reset, or platform operations?
            </p>

            <div className="mt-5 space-y-3">
              <a
                href="mailto:support@skulcredit.com?subject=SkulCredit%20Admin%20Support%20Request"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-rose-100 text-[#881337] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">Email Support</p>
                  <p className="text-[11px] text-[#881337] font-medium truncate">support@skulcredit.com</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 group-hover:text-[#881337] transition-colors">
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
                href="mailto:support@skulcredit.com?subject=SkulCredit%20Admin%20Support%20Request"
                className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#881337] hover:bg-[#6f0e2c] transition-colors shadow-xs"
              >
                Send Email
              </a>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forgot Password Modal ── */}
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

            <h3 className="text-lg font-bold text-gray-900">Administrator Password Reset</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              For security compliance, administrator credentials must be verified through the organization Super Admin or the technical operations team.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900">
              Please email <strong>support@skulcredit.com</strong> from your verified official staff email address with your staff ID to initiate an expedited password reset.
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:support@skulcredit.com?subject=Admin%20Password%20Reset%20Request"
                className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#881337] hover:bg-[#6f0e2c] transition-colors shadow-xs"
              >
                Request Reset via Email
              </a>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
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

export default AdminLoginPage;
