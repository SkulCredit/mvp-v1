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
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
                  className="text-sm font-semibold text-[#881337] hover:underline"
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
              <button className="font-semibold text-[#881337] hover:underline">
                Contact support
              </button>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminLoginPage;
