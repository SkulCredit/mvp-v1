import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { tokenStorage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND        = "#881337";
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS   = 30 * 60 * 1000; // 30 minutes
const RESEND_SEC   = 45;
const OTP_LENGTH   = 6;

const LOCKOUT_KEY  = "admin_otp_lockout_until";
const ATTEMPTS_KEY = "admin_otp_attempts";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLockoutRemaining(): number {
  const until = Number(localStorage.getItem(LOCKOUT_KEY) ?? 0);
  return Math.max(0, until - Date.now());
}
function setLockout() {
  localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
  localStorage.setItem(ATTEMPTS_KEY, "0");
}
function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
}
function getAttempts(): number {
  return Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0);
}
function incAttempts(): number {
  const next = getAttempts() + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(next));
  return next;
}
function fmtTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** The outer card wrapper matching the Figma pink border */
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="w-full max-w-[500px] rounded-3xl bg-white px-10 py-10 shadow-sm"
    style={{ border: "1.5px solid #f9a8c9" }}
  >
    {children}
  </div>
);

// ─── Scene: OTP Entry ─────────────────────────────────────────────────────────
const OtpEntryScene: React.FC<{
  email: string;
  onSuccess: () => void;
  onLockout: () => void;
}> = ({ email, onSuccess, onLockout }) => {
  const [digits, setDigits]         = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError]           = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS - getAttempts());
  const [loading, setLoading]       = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SEC);
  const [resending, setResending]   = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  const handleDigitChange = (idx: number, val: string) => {
    // Accept only digits; handle paste
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    setError("");
    if (cleaned && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Step 1 — verify MFA OTP (dedicated endpoint, no email-verify side-effects)
      await apiClient.post("/auth/verify-mfa-otp", { email, otp: code });
      // Step 2 — exchange verified identity for a real JWT + set cookie
      const loginRes = await apiClient.post<{ data: { accessToken: string } }>(
        "/auth/login-mfa", { email }
      );
      // Store the access token so auth context rehydrates on dashboard load
      tokenStorage.setAccess(loginRes.data.data.accessToken);
      clearLockout();
      onSuccess();
    } catch {
      const attempts = incAttempts();
      const left = MAX_ATTEMPTS - attempts;
      if (left <= 0) {
        setLockout();
        onLockout();
      } else {
        setAttemptsLeft(left);
        setError(`This code is invalid or expired. You have ${left} attempt${left === 1 ? "" : "s"} remaining.`);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    try {
      await apiClient.post("/auth/send-mfa-otp", { email });
      setResendCountdown(RESEND_SEC);
      setError("");
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
        Verify your OTP
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-gray-700">{email}</span>
      </p>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>
          </svg>
          {error}
        </div>
      )}

      {/* OTP digit boxes */}
      <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`OTP digit ${i + 1}`}
            className={[
              "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all",
              d
                ? "border-[#881337] text-gray-900"
                : "border-gray-200 text-gray-400",
              "focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Resend */}
      <p className="text-sm text-gray-500 text-center mb-6">
        Didn't receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || resending}
          className="font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: BRAND }}
        >
          {resending ? "Sending…" : "Resend OTP"}
        </button>
        {resendCountdown > 0 && (
          <span className="ml-1 text-gray-400">in 00:{String(resendCountdown).padStart(2, "0")}</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || digits.join("").length < OTP_LENGTH}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all
                   disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: BRAND }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#6f0e2c"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BRAND; }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying…
          </span>
        ) : "Verify and Continue"}
      </button>
    </Card>
  );
};

// ─── Scene: Success ───────────────────────────────────────────────────────────
const REDIRECT_SEC = 10;

const SuccessScene: React.FC<{ onDashboard: () => void }> = ({ onDashboard }) => {
  const [countdown, setCountdown] = useState(REDIRECT_SEC);

  useEffect(() => {
    if (countdown <= 0) {
      onDashboard();
      return;
    }
    const id = setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, onDashboard]);

  return (
  <Card>
    <div className="flex flex-col items-center text-center py-4">
      {/* Green circle check */}
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND }}>Login Successful!</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">
        Your identity has been verified.<br />
        You now have access to the Admin Portal
      </p>
      <p className="text-sm text-gray-400 mb-6">
        Redirecting to dashboard in{" "}
        <span className="font-bold tabular-nums" style={{ color: BRAND }}>{countdown}s</span>
        …
      </p>
      <button
        type="button"
        onClick={onDashboard}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
        style={{ backgroundColor: BRAND }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#6f0e2c"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BRAND; }}
      >
        Go to Dashboard
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
             strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  </Card>
  );
};

// ─── Scene: Access Denied / Lockout ─────────────────────────────────────────
const AccessDeniedScene: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [remaining, setRemaining] = useState(getLockoutRemaining());

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const r = getLockoutRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isLocked = remaining > 0;

  return (
    <Card>
      <div className="flex flex-col items-center text-center py-4">
        {/* Red circle X */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND }}>Access Denied</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          You do not have permission to access the Admin Portal.<br />
          If you believe this is an error, contact your administrator.
        </p>
        {isLocked && (
          <p className="text-sm font-semibold text-gray-700 mb-6">
            Try again in{" "}
            <span style={{ color: BRAND }}>{fmtTime(remaining)}</span>
          </p>
        )}
        {!isLocked && (
          <p className="text-sm text-green-600 font-semibold mb-6">
            Lockout expired — you may try again.
          </p>
        )}
        <button
          type="button"
          onClick={onBack}
          disabled={isLocked}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: BRAND }}
          onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.backgroundColor = "#6f0e2c"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BRAND; }}
        >
          Back to Login
        </button>
      </div>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type Scene = "otp" | "success" | "denied";

const AdminOtpPage: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  useAuth(); // ensures auth context is initialised

  // Email passed via navigate state from login page
  const email = (location.state as { email?: string })?.email ?? "";

  const [scene, setScene] = useState<Scene>(() =>
    getLockoutRemaining() > 0 ? "denied" : "otp"
  );

  // If someone lands here without an email (direct URL access), redirect to login
  useEffect(() => {
    if (!email) navigate("/admin/auth/login", { replace: true });
  }, [email, navigate]);

  const handleSuccess = () => {
    // Token already stored in OtpEntryScene after verify-mfa-otp + login-mfa
    setScene("success");
  };

  const handleDashboard = () => {
    navigate("/admin/dashboard", { replace: true });
  };

  const handleBack = () => {
    clearLockout();
    navigate("/admin/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <img src="/logo_nav.png" alt="SkulCredit" className="h-9 w-auto" />
      </Link>

      {scene === "otp" && (
        <OtpEntryScene
          email={email}
          onSuccess={handleSuccess}
          onLockout={() => setScene("denied")}
        />
      )}
      {scene === "success" && (
        <SuccessScene onDashboard={handleDashboard} />
      )}
      {scene === "denied" && (
        <AccessDeniedScene onBack={handleBack} />
      )}
    </div>
  );
};

export default AdminOtpPage;
