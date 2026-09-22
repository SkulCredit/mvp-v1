import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail]           = useState("akpeledavid@hotmail.com");
  const [password, setPassword]     = useState("SkulCreditAdmin@123");
  const [remember, setRemember]     = useState(true);
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);

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
      await login(email.trim(), password, "admin");
      const next = params.get("next");
      navigate(next && next.startsWith("/admin") ? next : "/admin/dashboard", {
        replace: true,
      });
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
            <img src="/logo_nav.png" alt="SkulCredit" className="h-9 w-auto" />
          </Link>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-20">
          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Smarter education<br />
            financing for a{" "}
            <span className="text-[#881337] font-extrabold">brighter<br />future</span>
          </h1>
          <p className="text-slate-600 text-base max-w-sm leading-relaxed">
            Empowering schools, parents, and students with flexible tuition financing and seamless school management.
          </p>
          <div className="mt-10 relative">
            <div className="w-full max-w-[340px] h-[220px] rounded-2xl bg-[#f5c6d8]/50 flex items-end justify-center overflow-hidden">
              <div className="w-full h-[180px] bg-gradient-to-t from-[#f5c6d8]/80 to-transparent rounded-b-2xl" />
            </div>
            <p className="absolute bottom-4 right-4 text-xs italic text-[#881337]/60 leading-snug text-right">
              Tuition today,<br />move possibilities<br />tomorrow
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-b border-slate-100">
          <button className="text-sm font-semibold text-slate-700 px-5 py-2 rounded-lg border border-[#881337] text-[#881337] hover:bg-rose-50 transition-colors">
            Sign in
          </button>
          <button className="text-sm font-semibold px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Create an Account
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[420px]">
            <p className="text-slate-500 text-base mb-1">Welcome to</p>
            <h2 className="text-3xl font-bold text-[#881337] mb-2">Skulcredit Admin</h2>
            <p className="text-slate-500 text-sm mb-8">
              Sign in to access your admin dashboard and manage applications, schools, and more.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <Icon name="alert-circle" className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-all"
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPw ? "eye" : "eye-off"} className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#881337]"
                  />
                  <span className="text-sm text-slate-600">Remember</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#881337] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-[#881337] text-white font-bold py-3.5 rounded-xl hover:bg-[#6f0e2c] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide"
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

              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                type="button"
                className="w-full py-3.5 rounded-xl border border-[#881337] text-[#881337] font-bold text-sm hover:bg-rose-50 transition-colors"
              >
                Create an admin Account
              </button>
            </form>
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
