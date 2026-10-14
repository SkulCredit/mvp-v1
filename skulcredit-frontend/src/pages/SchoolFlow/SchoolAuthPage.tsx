import React, { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

type SchoolView = "login" | "signup" | "otp" | "forgot";

interface RegData {
  schoolName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

type RegErrors = Partial<Record<keyof RegData | "form", string>>;

// Login form errors
interface LoginErrors {
  email?: string;
  password?: string;
}

// Password strength rules — must match backend requirements
const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { label: "One number (0–9)", test: (v) => /\d/.test(v) },
  {
    label: "One special character (!@#…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

const inputCls = (hasError?: boolean) =>
  [
    "w-full px-4 py-3 rounded-lg border text-sm text-slate-800 placeholder-slate-400",
    "outline-none transition-all bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand",
    hasError
      ? "border-red-400 bg-red-50"
      : "border-slate-200 hover:border-slate-300",
  ].join(" ");

const EyeBtn: React.FC<{ show: boolean; toggle: () => void }> = ({
  show,
  toggle,
}) => (
  <button
    type="button"
    onClick={toggle}
    aria-label={show ? "Hide password" : "Show password"}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
  >
    <Icon name={show ? "eye" : "eye-off"} className="w-4 h-4" />
  </button>
);

const FieldErr: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p role="alert" className="text-xs text-red-500 mt-1">
      {msg}
    </p>
  ) : null;

const Spinner: React.FC = () => (
  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const VerificationModal: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="verify-modal-title"
  >
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up">
      {/* heading card */}
      <div className="rounded-xl border border-brand/30 bg-rose-50/60 px-5 py-4 mb-5 text-center">
        <h2
          id="verify-modal-title"
          className="text-lg font-bold text-brand mb-2"
        >
          Complete Your School Verification
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Provide your school details and accreditation documents to activate
          your account and access the dashboard.
        </p>
      </div>

      {/* checklist */}
      <div className="rounded-xl border border-brand/20 bg-white px-5 py-4 mb-6">
        <p className="text-sm font-semibold text-brand mb-3">
          What You'll Need:
        </p>
        <ul className="space-y-2">
          {[
            "Basic school information",
            "Location & contact details",
            "Government approval/accreditation documents",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-brand"
            >
              <span>•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-lg shadow-brand/20"
      >
        Start Verification
        <Icon name="arrow-right" className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const SchoolAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<SchoolView>("login");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [reg, setReg] = useState<RegData>({
    schoolName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [regErrors, setRegErrors] = useState<RegErrors>({});
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const startCooldown = () => {
    setResendCooldown(60);
    countdownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const upd = (field: keyof RegData, value: string | boolean) => {
    setReg((p) => ({ ...p, [field]: value }));
    if (regErrors[field as keyof RegErrors])
      setRegErrors((p) => ({ ...p, [field]: undefined }));
  };

  // ── Login validation ────────────────────────────────────────────────────────
  const validateLogin = (): boolean => {
    const e: LoginErrors = {};

    if (!loginEmail.trim()) {
      e.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      e.email = "Enter a valid email address.";
    }

    if (!loginPassword) {
      e.password = "Password is required.";
    } else if (loginPassword.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }

    setLoginErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!validateLogin()) return; // stop before hitting the network
    setIsLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword, "school");
      const next = searchParams.get("next");
      navigate(next && next.startsWith("/") ? next : "/school/dashboard", {
        replace: true,
      });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setLoginError(
        axErr.response?.data?.message ??
          (err as Error).message ??
          "Invalid school credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Registration validation ─────────────────────────────────────────────────
  const validateReg = (): boolean => {
    const e: RegErrors = {};

    if (!reg.schoolName.trim()) e.schoolName = "School name is required.";
    else if (reg.schoolName.trim().length < 2)
      e.schoolName = "School name must be at least 2 characters.";

    if (!reg.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email.trim()))
      e.email = "Enter a valid email address.";

    if (reg.phoneNumber.trim() && reg.phoneNumber.trim().length < 10)
      e.phoneNumber = "Phone number must be at least 10 digits.";

    if (!reg.password) e.password = "Password is required.";
    else if (!PASSWORD_RULES.every((r) => r.test(reg.password)))
      e.password = "Password does not meet all requirements.";

    if (!reg.confirmPassword)
      e.confirmPassword = "Please re-enter your password.";
    else if (reg.password !== reg.confirmPassword)
      e.confirmPassword = "Passwords do not match.";

    if (!reg.agreedToTerms)
      e.agreedToTerms = "You must agree to the terms to continue.";

    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReg()) return;
    setIsLoading(true);
    setRegErrors({});
    try {
      await register(
        {
          schoolName: reg.schoolName.trim(),
          contactPerson: reg.schoolName.trim(),
          email: reg.email.trim(),
          password: reg.password,
          phoneNumber: reg.phoneNumber.trim(),
        },
        "school",
      );
      setRegisteredEmail(reg.email.trim());
      setOtpValue("");
      setOtpError("");
      startCooldown();
      setView("otp");
    } catch (err) {
      const axErr = err as AxiosError<{
        errors?: { message: string }[];
        message?: string;
      }>;
      setRegErrors({
        form:
          axErr.response?.data?.errors?.[0]?.message ??
          axErr.response?.data?.message ??
          (err as Error).message ??
          "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpError("");
    setIsLoading(true);
    try {
      await apiClient.post("/auth/verify-otp", {
        email: registeredEmail,
        otp: otpValue,
      });
      setShowVerifyModal(true);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setOtpError(
        axErr.response?.data?.message ??
          "Invalid or expired code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await apiClient.post("/auth/send-otp", { email: registeredEmail });
      startCooldown();
    } catch {}
  };

  return (
    <>
      {showVerifyModal && (
        <VerificationModal
          onStart={() => {
            setShowVerifyModal(false);
            navigate("/school/onboarding");
          }}
        />
      )}
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        {/* ══ LOGIN ══ */}
        {view === "login" && (
          <div className="w-full max-w-md animate-fade-in-up bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-center mb-8">
              <img
                src="/logo_nav.png"
                alt="SkulCredit"
                className="h-10 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-brand mb-1">
                School Login
              </h1>
              <p className="text-sm text-slate-500">
                Log in to manage your students and disbursements.
              </p>
            </div>

            <div className="">
              <form className="space-y-5" onSubmit={handleLogin} noValidate>
                {loginError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium"
                  >
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    School Admin Email*
                  </label>
                  <input
                    type="email"
                    placeholder="admin@school.edu.ng"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginErrors.email)
                        setLoginErrors((p) => ({ ...p, email: undefined }));
                    }}
                    className={inputCls(!!loginErrors.email)}
                  />
                  <FieldErr msg={loginErrors.email} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPw ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password)
                          setLoginErrors((p) => ({
                            ...p,
                            password: undefined,
                          }));
                      }}
                      className={inputCls(!!loginErrors.password) + " pr-10"}
                    />
                    <EyeBtn
                      show={showLoginPw}
                      toggle={() => setShowLoginPw(!showLoginPw)}
                    />
                  </div>
                  <FieldErr msg={loginErrors.password} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-brand rounded"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-md shadow-brand/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Spinner /> Signing In…
                    </>
                  ) : (
                    "Sign In →"
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Not registered yet?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="font-bold text-brand hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ══ SIGN UP ══ */}
        {view === "signup" && (
          <div className="w-full max-w-md animate-fade-in-up bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-center mb-8">
              <img
                src="/logo_nav.png"
                alt="SkulCredit"
                className="h-10 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-brand">SkulCredit</h1>
              <h2 className="text-lg font-semibold text-slate-800 mt-1">
                Create School Account
              </h2>
              <p className="text-sm text-brand mt-1.5">
                Join us to build consistent revenue and stronger educational
                impact
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-brand/30 shadow-sm p-6">
              {regErrors.form && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium"
                >
                  {regErrors.form}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleRegister} noValidate>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    School Name*
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={reg.schoolName}
                    onChange={(e) => upd("schoolName", e.target.value)}
                    className={inputCls(!!regErrors.schoolName)}
                  />
                  <FieldErr msg={regErrors.schoolName} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    School Email Address*
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={reg.email}
                    onChange={(e) => upd("email", e.target.value)}
                    className={inputCls(!!regErrors.email)}
                  />
                  <FieldErr msg={regErrors.email} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    autoComplete="tel"
                    value={reg.phoneNumber}
                    onChange={(e) => upd("phoneNumber", e.target.value)}
                    className={inputCls(!!regErrors.phoneNumber)}
                  />
                  <FieldErr msg={regErrors.phoneNumber} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPw ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={reg.password}
                      onChange={(e) => upd("password", e.target.value)}
                      className={inputCls(!!regErrors.password) + " pr-10"}
                    />
                    <EyeBtn
                      show={showRegPw}
                      toggle={() => setShowRegPw(!showRegPw)}
                    />
                  </div>
                  <FieldErr msg={regErrors.password} />
                  {/* Live password strength checklist */}
                  {reg.password.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(reg.password);
                        return (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              passed ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                passed
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {passed && (
                                <svg
                                  viewBox="0 0 10 8"
                                  className="w-2 h-2 fill-white"
                                >
                                  <path
                                    d="M1 4l3 3 5-6"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfPw ? "text" : "password"}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      value={reg.confirmPassword}
                      onChange={(e) => upd("confirmPassword", e.target.value)}
                      className={
                        inputCls(!!regErrors.confirmPassword) + " pr-10"
                      }
                    />
                    <EyeBtn
                      show={showConfPw}
                      toggle={() => setShowConfPw(!showConfPw)}
                    />
                  </div>
                  <FieldErr msg={regErrors.confirmPassword} />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reg.agreedToTerms}
                      onChange={(e) => upd("agreedToTerms", e.target.checked)}
                      className="w-4 h-4 accent-brand rounded flex-shrink-0"
                    />
                    <span className="text-sm text-slate-600">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="font-bold text-brand hover:underline"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="font-bold text-brand hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  <FieldErr msg={regErrors.agreedToTerms} />
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !PASSWORD_RULES.every((r) => r.test(reg.password)) ||
                    !reg.agreedToTerms
                  }
                  className="w-full bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-md shadow-brand/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Spinner /> Creating Account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-brand hover:underline"
                  >
                    Login
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}

        {view === "otp" && (
          <div className="w-full max-w-md animate-fade-in-up bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Icon name="mail" className="w-8 h-8 text-brand" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                Verify Your Email
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[85%] mx-auto">
                We sent a 6-digit code to{" "}
                <span className="font-bold text-slate-800">
                  {registeredEmail}
                </span>
                . Enter it below to activate your account.
              </p>
            </div>

            <div className="">
              <form className="space-y-5" onSubmit={handleVerifyOtp} noValidate>
                {otpError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium"
                  >
                    {otpError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">
                    6-digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    value={otpValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpValue(val);
                      if (otpError) setOtpError("");
                    }}
                    className={
                      "w-full px-4 py-4 rounded-2xl border text-3xl tracking-[0.6em] text-center " +
                      "font-bold text-slate-800 bg-slate-50 outline-none transition-all " +
                      "focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 " +
                      (otpError ? "border-red-400" : "border-slate-200")
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpValue.length !== 6}
                  className={[
                    "w-full font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2",
                    isLoading || otpValue.length !== 6
                      ? "bg-brand/30 text-brand/50 cursor-not-allowed"
                      : "bg-brand text-white hover:bg-[#7a1848] shadow-md shadow-brand/20",
                  ].join(" ")}
                >
                  {isLoading ? (
                    <>
                      <Spinner /> Verifying…
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Didn't receive a code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-bold text-brand hover:underline transition-colors"
                    >
                      Resend code
                    </button>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => setView("signup")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="arrow-left" className="w-4 h-4" />
                  Back to sign up
                </button>
              </form>
            </div>
          </div>
        )}
        {view === "forgot" && (
          <div className="w-full max-w-md animate-fade-in-up bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-center mb-8">
              <img
                src="/logo_nav.png"
                alt="SkulCredit"
                className="h-10 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Reset Your Password
              </h1>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Enter your registered school email and we'll send a reset link.
              </p>
            </div>

            <div className="">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setView("login");
                }}
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Official Email Address*
                  </label>
                  <input
                    type="email"
                    placeholder="admin@school.edu.ng"
                    required
                    className={inputCls()}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-md shadow-brand/20 flex items-center justify-center gap-2"
                >
                  Send Reset Link
                  <Icon name="send" className="w-4 h-4" />
                </button>

                <p className="text-center text-sm text-slate-500">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-brand hover:underline"
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SchoolAuthPage;
