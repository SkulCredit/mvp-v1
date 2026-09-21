import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";
import apiClient from "../../services/apiClient";
import { authService } from "../../services/authService";
import { AxiosError } from "axios";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}
const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "One special character (!@#$%)",
    test: (pw) => /[^a-zA-Z0-9]/.test(pw),
  },
];

const ErrorIcon: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    aria-hidden="true"
    className="flex-shrink-0 mt-px"
  >
    <circle cx="6.5" cy="6.5" r="6" stroke="#AA1701" strokeWidth="1.3" />
    <path
      d="M6.5 3.5V7"
      stroke="#AA1701"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="6.5" cy="9.2" r="0.65" fill="#AA1701" />
  </svg>
);

const FieldError: React.FC<{ msg?: string; children?: React.ReactNode }> = ({
  msg,
  children,
}) =>
  msg ? (
    <p
      role="alert"
      className="flex items-center gap-1 text-xs mt-1"
      style={{ color: "#AA1701" }}
    >
      <ErrorIcon />
      {children ?? msg}
    </p>
  ) : null;

const GoogleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}> = ({ checked, onChange, id = "toggle" }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onChange(!checked)}
    className={[
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
      "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
      checked ? "bg-brand" : "bg-gray-200",
    ].join(" ")}
  >
    <span
      className={[
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-5" : "translate-x-0",
      ].join(" ")}
    />
  </button>
);

const RuleIcon: React.FC<{ empty: boolean; passed: boolean }> = ({
  empty,
  passed,
}) => {
  if (empty)
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="#D1D5DB" strokeWidth="1.5" />
      </svg>
    );
  if (passed)
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="6.5" fill="#22C55E" />
        <path
          d="M3.5 6.5L5.5 8.5L9.5 4.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill="#AA1701" />
      <path
        d="M4.5 4.5L8.5 8.5M8.5 4.5L4.5 8.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

const inputCls = (hasError: boolean): string =>
  [
    "w-full px-4 py-3 rounded-2xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200",
    "bg-slate-50/50 focus:bg-white focus:ring-4",
    hasError
      ? "border-[#AA1701] focus:border-[#AA1701] focus:ring-[#AA1701]/10"
      : "border-slate-200 focus:border-brand focus:ring-brand/10",
  ].join(" ");

interface RegState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

type RegErrors = Partial<Record<keyof RegState | "form", string>>;
type CheckingState = { email: boolean; phone: boolean };

type View = "login" | "signup" | "otp" | "forgot";

const ParentAuthPage: React.FC = () => {
  const [view, setView] = useState<View>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register state
  const [reg, setReg] = useState<RegState>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [regErrors, setRegErrors] = useState<RegErrors>({});
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);
  const [checking, setChecking] = useState<CheckingState>({
    email: false,
    phone: false,
  });

  // OTP state
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Shared
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (emailTimer.current) clearTimeout(emailTimer.current);
      if (phoneTimer.current) clearTimeout(phoneTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startResendCooldown = () => {
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

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword, "parent");
      navigate("/parent/dashboard");
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setLoginError(
        axErr.response?.data?.message ??
          (err as Error).message ??
          "Invalid credentials. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleCheck = (field: "email" | "phone", value: string) => {
    const ref = field === "email" ? emailTimer : phoneTimer;
    if (ref.current) clearTimeout(ref.current);
    if (!value.trim()) return;
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    if (field === "phone" && !/^[0-9+\s\-()+]{7,15}$/.test(value)) return;

    ref.current = setTimeout(async () => {
      setChecking((p) => ({ ...p, [field]: true }));
      try {
        const result = await authService.checkAvailability(
          field === "email" ? { email: value.trim() } : { phone: value.trim() },
        );
        const available = field === "email" ? result?.email : result?.phone;
        if (available === false) {
          setRegErrors((p) => ({
            ...p,
            [field === "email" ? "email" : "phoneNumber"]:
              field === "email"
                ? "__email_taken__"
                : "This phone number is already in use.",
          }));
        }
      } catch {
        /* silent */
      } finally {
        setChecking((p) => ({ ...p, [field]: false }));
      }
    }, 600);
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReg((p) => ({ ...p, [name]: value }));
    if (regErrors[name as keyof RegErrors])
      setRegErrors((p) => ({ ...p, [name]: undefined }));
    if (name === "email") scheduleCheck("email", value);
    if (name === "phoneNumber") scheduleCheck("phone", value);
  };

  const validateReg = (): boolean => {
    const errs: RegErrors = {};
    if (!reg.firstName.trim()) errs.firstName = "First name is required.";
    else if (reg.firstName.trim().length < 2)
      errs.firstName = "First name must be at least 2 characters.";

    if (!reg.lastName.trim()) errs.lastName = "Last name is required.";
    else if (reg.lastName.trim().length < 2)
      errs.lastName = "Last name must be at least 2 characters.";

    if (!reg.email.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email))
      errs.email = "Enter a valid email address.";
    else if (regErrors.email === "__email_taken__")
      errs.email = "__email_taken__";

    if (!reg.phoneNumber.trim()) errs.phoneNumber = "Phone number is required.";
    else if (reg.phoneNumber.trim().length < 10)
      errs.phoneNumber = "Phone number must be at least 10 digits.";
    else if (regErrors.phoneNumber === "This phone number is already in use.")
      errs.phoneNumber = regErrors.phoneNumber;

    if (!reg.password) errs.password = "Password is required.";
    else if (!PASSWORD_RULES.every((r) => r.test(reg.password)))
      errs.password = "Password does not meet all requirements.";

    if (!reg.confirmPassword)
      errs.confirmPassword = "Please confirm your password.";
    else if (reg.password !== reg.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";

    if (!reg.agreeToTerms)
      errs.agreeToTerms = "You must agree to the terms to continue.";

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReg()) return;
    setIsLoading(true);
    setRegErrors((p) => ({ ...p, form: undefined }));
    try {
      await apiClient.post("/auth/register/parent", {
        firstName: reg.firstName.trim(),
        lastName: reg.lastName.trim(),
        email: reg.email.trim(),
        phoneNumber: reg.phoneNumber.trim(),
        password: reg.password,
      });
      setRegisteredEmail(reg.email.trim());
      setOtpValue("");
      setOtpError("");
      startResendCooldown();
      setView("otp");
    } catch (err) {
      const axErr = err as AxiosError<{
        errors?: { message: string }[];
        message?: string;
      }>;
      const msg =
        axErr.response?.data?.errors?.[0]?.message ??
        axErr.response?.data?.message ??
        "Registration failed. Please try again.";
      setRegErrors((p) => ({ ...p, form: msg }));
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
      setView("login");
      setLoginEmail(registeredEmail);
      setLoginError("");
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
      startResendCooldown();
    } catch {
      /* silent */
    }
  };

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(reg.password));
  const canSubmitReg = allRulesPassed && reg.agreeToTerms;

  return (
    <>
      {/* Background blobs */}
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-rose-200/50 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div
          className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <div className="w-full max-w-[520px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-8 md:p-10 shadow-[0_30px_60px_-15px_rgba(136,19,55,0.15),inset_0_0_0_1px_rgba(255,255,255,0.9)] relative z-10">
          {/* ══ LOGIN ══ */}
          {view === "login" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <img
                  src="/logo_nav.png"
                  alt="SkulCredit"
                  className="h-12 w-auto mx-auto mb-5"
                />
                <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                  Login to your Account
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Welcome back! Please login to your account.
                </p>
              </div>
              <form className="space-y-5" onSubmit={handleLogin}>
                {loginError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100"
                  >
                    {loginError}
                  </div>
                )}
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPw ? "text" : "password"}
                      placeholder="Your password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                    >
                      <Icon
                        name={showLoginPw ? "eye" : "eye-off"}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 checked:bg-brand checked:border-brand transition-all cursor-pointer outline-none focus:ring-4 focus:ring-brand/20"
                      />
                      <Icon
                        name="check"
                        className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]"
                      />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-bold text-brand hover:text-brand-light transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)] mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                  {!isLoading && (
                    <Icon name="arrow-right" className="w-4 h-4" />
                  )}
                </button>
                <p className="text-center text-sm text-slate-500 font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="font-bold text-brand hover:text-brand-light transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* ══ SIGN UP ══ */}
          {view === "signup" && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <img
                  src="/logo_nav.png"
                  alt="SkulCredit"
                  className="h-12 w-auto mx-auto mb-5"
                />
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Create Parent Account
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Start your journey to affordable education
                </p>
              </div>
              {regErrors.form && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100"
                >
                  {regErrors.form}
                </div>
              )}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition mb-5"
              >
                <GoogleIcon />
                Sign up with Google
              </button>
              <div className="relative mb-5 flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-4 flex-shrink text-xs text-slate-400 font-medium">
                  Or sign up with email
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleRegisterSubmit}
                noValidate
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      First Name*
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      autoComplete="given-name"
                      value={reg.firstName}
                      onChange={handleRegChange}
                      className={inputCls(!!regErrors.firstName)}
                    />
                    <FieldError msg={regErrors.firstName} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      autoComplete="family-name"
                      value={reg.lastName}
                      onChange={handleRegChange}
                      className={inputCls(!!regErrors.lastName)}
                    />
                    <FieldError msg={regErrors.lastName} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-bold text-slate-700">
                      Email Address*
                    </label>
                    {checking.email && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    )}
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={reg.email}
                    onChange={handleRegChange}
                    className={inputCls(!!regErrors.email)}
                  />
                  {regErrors.email && regErrors.email !== "__email_taken__" && (
                    <FieldError msg={regErrors.email} />
                  )}
                  {regErrors.email === "__email_taken__" && (
                    <p
                      role="alert"
                      className="flex items-center gap-1 text-xs mt-1"
                      style={{ color: "#AA1701" }}
                    >
                      <ErrorIcon />
                      An account with this email already exists.{" "}
                      <button
                        type="button"
                        onClick={() => setView("login")}
                        className="font-semibold underline ml-0.5"
                        style={{ color: "#1D4ED8" }}
                      >
                        Log in instead
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-bold text-slate-700">
                      Phone Number*
                    </label>
                    {checking.phone && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    )}
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="08011111111"
                    autoComplete="tel"
                    value={reg.phoneNumber}
                    onChange={handleRegChange}
                    className={inputCls(!!regErrors.phoneNumber)}
                  />
                  <FieldError msg={regErrors.phoneNumber} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPw ? "text" : "password"}
                      name="password"
                      placeholder="Secret@123"
                      autoComplete="new-password"
                      value={reg.password}
                      onChange={handleRegChange}
                      className={inputCls(!!regErrors.password) + " pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw(!showRegPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                    >
                      <Icon
                        name={showRegPw ? "eye" : "eye-off"}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {PASSWORD_RULES.map((rule) => {
                      const empty = reg.password.length === 0;
                      const passed = rule.test(reg.password);
                      return (
                        <div
                          key={rule.label}
                          className="flex items-center gap-1.5"
                        >
                          <span className="flex-shrink-0">
                            <RuleIcon empty={empty} passed={passed} />
                          </span>
                          <span
                            className={`text-xs ${empty ? "text-slate-400" : passed ? "text-green-600" : "text-[#AA1701]"}`}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showConfPw ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      value={reg.confirmPassword}
                      onChange={handleRegChange}
                      className={
                        inputCls(!!regErrors.confirmPassword) + " pr-12"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfPw(!showConfPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                    >
                      <Icon
                        name={showConfPw ? "eye" : "eye-off"}
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                  <FieldError msg={regErrors.confirmPassword} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      id="agreeToTerms"
                      checked={reg.agreeToTerms}
                      onChange={(val) => {
                        setReg((p) => ({ ...p, agreeToTerms: val }));
                        if (regErrors.agreeToTerms)
                          setRegErrors((p) => ({
                            ...p,
                            agreeToTerms: undefined,
                          }));
                      }}
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="cursor-pointer text-sm text-slate-600 select-none"
                    >
                      I agree to the{" "}
                      <a
                        href="#"
                        className="font-semibold text-brand hover:underline"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="font-semibold text-brand hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                  <FieldError msg={regErrors.agreeToTerms} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !canSubmitReg}
                  className={[
                    "w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-1",
                    !canSubmitReg || isLoading
                      ? "bg-brand/30 text-brand/50 cursor-not-allowed shadow-none"
                      : "bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)]",
                  ].join(" ")}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                  {!isLoading && (
                    <Icon name="arrow-right" className="w-4 h-4" />
                  )}
                </button>
                <p className="text-center text-sm text-slate-500 font-medium">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-brand hover:text-brand-light transition-colors"
                  >
                    Login
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* ══ OTP VERIFICATION ══ */}
          {view === "otp" && (
            <div className="animate-fade-in-up py-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-blue-100">
                  <Icon name="mail" className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
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
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                {otpError && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100"
                  >
                    {otpError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-center">
                    6-digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    required
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpValue(val);
                      if (otpError) setOtpError("");
                    }}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-3xl tracking-[0.6em] text-center text-slate-800 font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otpValue.length !== 6}
                  className={[
                    "w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2",
                    isLoading || otpValue.length !== 6
                      ? "bg-brand/30 text-brand/50 cursor-not-allowed"
                      : "bg-brand text-white hover:bg-brand-hover shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)] hover:-translate-y-0.5 active:translate-y-0",
                  ].join(" ")}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
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
                  <Icon name="arrow-left" className="w-4 h-4" /> Back to sign up
                </button>
              </form>
            </div>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {view === "forgot" && (
            <div className="animate-fade-in-up py-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-50 text-brand rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
                  <Icon name="key-round" className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
                  Forgot Password?
                </h1>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[90%] mx-auto">
                  Enter your registered email. We'll send a verification code to
                  reset your password.
                </p>
              </div>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setView("login");
                }}
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-hover hover:-translate-y-0.5 transition-all shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)] flex items-center justify-center gap-2"
                >
                  Send Reset Code
                  <Icon name="send" className="w-4 h-4" />
                </button>
                <p className="text-center text-sm text-slate-500 font-medium">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-brand hover:text-brand-light transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParentAuthPage;
