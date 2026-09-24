import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import {
  parentService,
  catalogService,
  NinVerificationData,
  CatalogInstitutionType,
  CatalogSchool,
  CatalogClassLevelGroup,
} from "../../services/parentService";
import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import {
  getCountryCallingCode,
  getCountries,
} from "react-phone-number-input/input";
import type { Country } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import { resolveUploadUrl } from "../../utils/uploadUrl";

const ALL_COUNTRIES = getCountries();

interface PhoneFieldProps {
  value: string;
  country: Country;
  onChange: (number: string) => void;
  onCountryChange: (c: Country) => void;
  placeholder?: string;
  error?: boolean;
}

const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  country,
  onChange,
  onCountryChange,
  placeholder = "Enter phone number",
  error,
}) => {
  const dialCode = `+${getCountryCallingCode(country)}`;
  return (
    <div
      className={[
        "flex w-full rounded-lg border bg-white transition-colors",
        "focus-within:ring-2 focus-within:ring-[#8B1C53]/20 focus-within:border-[#8B1C53]",
        error
          ? "border-red-400 bg-red-50"
          : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      <div className="relative flex items-center shrink-0 border-r border-gray-200">
        <div className="flex items-center gap-1 px-3 h-full pointer-events-none select-none">
          <span className="text-sm font-semibold text-[#8B1C53]">
            {dialCode}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 text-gray-400"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <select
          aria-label="Country code"
          value={country}
          onChange={(e) => onCountryChange(e.target.value as Country)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          {ALL_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {(en as Record<string, string>)[c]} (+{getCountryCallingCode(c)})
            </option>
          ))}
        </select>
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "flex-1 rounded-r-xl px-3 py-2.5 text-sm bg-transparent outline-none",
          "placeholder-gray-400",
          error ? "text-red-700" : "text-gray-800",
        ].join(" ")}
      />
    </div>
  );
};

interface ToastState {
  message: string;
  visible: boolean;
}

const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(
      () => setToast({ message: "", visible: false }),
      4000,
    );
  }, []);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message: "", visible: false });
  }, []);

  return { toast, showToast, dismissToast };
};

const Toast: React.FC<{
  message: string;
  visible: boolean;
  onDismiss: () => void;
}> = ({ message, visible, onDismiss }) => (
  <div
    role="alert"
    aria-live="assertive"
    className={[
      "fixed top-5 left-1/2 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg",
      "bg-white border border-red-200 text-red-700 text-sm font-medium",
      "transition-all duration-300 ease-out",
      visible
        ? "-translate-x-1/2 translate-y-0 opacity-100"
        : "-translate-x-1/2 -translate-y-4 opacity-0 pointer-events-none",
    ].join(" ")}
    style={{ minWidth: "320px", maxWidth: "520px" }}
  >
    <span
      className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
      aria-hidden="true"
    />
    <span className="flex-1">{message}</span>
    <button
      onClick={onDismiss}
      aria-label="Dismiss error"
      className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-4 h-4"}
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const BackIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const PlusCircleIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-10 h-10 text-gray-400"}
    aria-hidden="true"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PaperclipIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-gray-500"
    aria-hidden="true"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const UserPhotoIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10 text-gray-300"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const SubmitCheckIcon: React.FC = () => (
  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-10 h-10"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#16a34a"
        strokeWidth="1.8"
        fill="none"
      />
      <path d="M7 12.5l3.5 3.5 6-7" stroke="#16a34a" strokeWidth="2.2" />
    </svg>
  </div>
);

const STEPS = [
  { label: "Parent/Guardian\nInformation", short: "Parent Info" },
  { label: "BVN/NIN &\nCredit Verification", short: "KYC" },
  { label: "Select School &\nTuition Plan", short: "School" },
  { label: "Student\nInformation", short: "Students" },
] as const;

type Step = 0 | 1 | 2 | 3;

const RELATIONSHIPS = ["Parent", "Guardian", "Sponsor"];
const EMPLOYER_TYPES = [
  "Employed (Private)",
  "Employed (Government)",
  "Self-employed",
  "Business Owner",
  "Freelancer",
  "Other",
];
const YEARS_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "6–10 years",
  "10+ years",
];
const INCOME_RANGES = [
  "₦50,000 – ₦100,000",
  "₦100,001 – ₦250,000",
  "₦250,001 – ₦500,000",
  "₦500,001 – ₦1,000,000",
  "Above ₦1,000,000",
];
const REPAYMENT_PLANS = [
  "3-month Installment",
  "6-month Installment",
  "12-month Installment",
];
const SESSIONS = [
  "2024/2025-First Term",
  "2024/2025-Second Term",
  "2024/2025-Third Term",
  "2025/2026-First Semester",
  "2025/2026-Second Semester",
];
const DOCUMENT_TYPES = [
  "Bank Statement (Last 3 Months)",
  "Employment Letter or Business registration",
  "Utility Bill (Proof of Address",
];

const tenorFromPlan = (plan: string): number => {
  if (plan.startsWith("3")) return 3;
  if (plan.startsWith("6")) return 6;
  if (plan.startsWith("12")) return 12;
  return 6;
};

interface SpouseData {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: Country;
  employerType: string;
}

interface Step1Data {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: Country;
  relationship: string;
  employerType: string;
  yearsInRole: string;
  monthlyIncome: string;
  countryId: number;
  stateId: number;
  addressCountryName: string;
  addressState: string;
  addressCity: string;
  addressLga: string;
  addressStreet: string;
  dob: string;
  photoUrl: string;
  photoPreview: string;
  photoFile: File | null;
  photoUploading: boolean;
  spouse: SpouseData;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  docType: string;
  file: File;
  status: "verified" | "pending" | "failed";
}

interface Step2Data {
  bvnOrNin: "bvn" | "nin";
  bvn: string;
  nin: string;
  bvnStatus: "idle" | "error" | "verified";
  ninStatus: "idle" | "verifying" | "verified" | "error";
  ninData: NinVerificationData | null;
  selectedDocType: string;
  employerName: string;
  companyName: string;
  pendingFile: File | null;
  uploadedDocs: UploadedDoc[];
  scoreCheckStatus: "idle" | "checking" | "passed" | "failed";
}

interface Step3Data {
  institutionTypeId: string;
  institutionType: string;
  schoolId: string;
  schoolName: string;
  gradeLevel: string;
  repaymentPlan: string;
  academicSession: string;
  tuitionAmount: string;
}

interface StudentEntry {
  fullName: string;
  dob: string;
  gender: string;
  admissionNumber: string;
}

interface Step4Data {
  students: StudentEntry[];
  termsConfirmed: boolean;
}

interface WizardState {
  step: Step;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  applicationRef: string | null;
  isSubmitting: boolean;
  showSuccess: boolean;
  isScoreChecking: boolean;
  scoreBlocked: boolean;
}

interface EligibilityProfile {
  firstName: string;
  lastName: string;
  middleName: string | null;
  dob: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressLga: string | null;
  addressState: string | null;
  addressCountry: string | null;
  profilePhotoUrl: string | null;
  kycStatus: string;
  relationship: string | null;
  employerType: string | null;
  yearsInRole: string | null;
  monthlyIncome: string | null;
  eligibilityBlockedUntil: string | null;
  email: string;
  phoneNumber: string;
}

type PageMode = "loading" | "wizard" | "blocked" | "review";

const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, error, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && (
      <p role="alert" className="text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

const inputCls = (error?: string) =>
  `w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors border bg-white
   placeholder-gray-400 focus:ring-2 focus:ring-[#8B1C53]/20 focus:border-[#8B1C53]
   ${error ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-800 hover:border-gray-300"}`;

const selectCls = (error?: string) =>
  `w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors border bg-white appearance-none
   focus:ring-2 focus:ring-[#8B1C53]/20 focus:border-[#8B1C53] cursor-pointer
   ${error ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-800 hover:border-gray-300"}`;

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}:</span>
    <span className="text-sm font-medium text-gray-800 text-right ml-4">
      {value}
    </span>
  </div>
);

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => (
  <div className="flex items-start justify-center gap-0 mb-8">
    {STEPS.map((s, i) => {
      const done = i < current;
      const active = i === current;
      const isLast = i === STEPS.length - 1;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
            <div
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                done
                  ? "border-green-500 bg-green-500 text-white"
                  : active
                    ? "border-[#8B1C53] bg-[#8B1C53] text-white"
                    : "border-gray-200 bg-white text-gray-400",
              ].join(" ")}
            >
              {done ? <CheckIcon /> : i + 1}
            </div>
            <p
              className={`mt-1.5 text-center text-[10px] sm:text-[11px] leading-snug whitespace-pre-line ${
                active
                  ? "text-[#8B1C53] font-semibold"
                  : done
                    ? "text-[#8B1C53]"
                    : "text-gray-400"
              }`}
            >
              {s.label}
            </p>
          </div>
          {!isLast && (
            <div
              className={`mt-4 h-0.5 flex-1 mx-1 ${done ? "bg-[#8B1C53]" : "bg-gray-200"}`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const SelectWithChevron: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  error?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, error, disabled }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={
        selectCls(error) + (disabled ? " opacity-60 cursor-not-allowed" : "")
      }
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
);

type VerifyItemStatus =
  | "idle"
  | "verifying"
  | "verified"
  | "error"
  | "checking"
  | "passed"
  | "failed";

interface VerifyItem {
  label: string;
  sublabel: string;
  status: VerifyItemStatus;
}

const VerificationTracker: React.FC<{ items: VerifyItem[] }> = ({ items }) => {
  const nodeFor = (status: VerifyItemStatus, isLast: boolean) => {
    const done = status === "verified" || status === "passed";
    const active = status === "verifying" || status === "checking";
    const failed = status === "error" || status === "failed";

    let nodeEl: React.ReactNode;

    if (done) {
      nodeEl = (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0 z-10 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      );
    } else if (active) {
      nodeEl = (
        <div className="w-10 h-10 rounded-full bg-[#8B1C53]/10 border-2 border-[#8B1C53] flex items-center justify-center shrink-0 z-10">
          <svg
            className="w-4 h-4 text-[#8B1C53] animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </div>
      );
    } else if (failed) {
      nodeEl = (
        <div className="w-10 h-10 rounded-full bg-red-50 border-2 border-red-400 flex items-center justify-center shrink-0 z-10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      );
    } else {
      nodeEl = (
        <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shrink-0 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center self-stretch">
        {nodeEl}
        {!isLast && (
          <div
            className={`w-0.5 flex-1 mt-1 mb-1 ${done ? "bg-green-400" : "bg-gray-200"}`}
          />
        )}
      </div>
    );
  };

  const labelCls = (status: VerifyItemStatus) => {
    if (status === "verified" || status === "passed")
      return "text-gray-900 font-bold";
    if (status === "verifying" || status === "checking")
      return "text-[#8B1C53] font-bold";
    if (status === "error" || status === "failed")
      return "text-red-600 font-bold";
    return "text-gray-400 font-semibold";
  };

  const sublabelCls = (status: VerifyItemStatus) => {
    if (status === "verified" || status === "passed") return "text-gray-500";
    if (status === "verifying" || status === "checking")
      return "text-[#8B1C53]/70";
    if (status === "error" || status === "failed") return "text-red-400";
    return "text-gray-300";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 flex flex-col">
      <p className="text-sm font-bold text-gray-800 mb-4">
        Verification Timeline
      </p>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex gap-4 min-h-[56px]">
            {nodeFor(item.status, isLast)}
            <div
              className={`flex flex-col justify-start pt-1.5 pb-4 ${isLast ? "pb-0" : ""}`}
            >
              <p className={`text-sm leading-tight ${labelCls(item.status)}`}>
                {item.label}
              </p>
              <p
                className={`text-xs mt-0.5 uppercase tracking-wide ${sublabelCls(item.status)}`}
              >
                {item.sublabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EligibilityTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, dismissToast } = useToast();

  const docFileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [pageMode, setPageMode] = useState<PageMode>("loading");
  const [eligibilityProfile, setEligibilityProfile] =
    useState<EligibilityProfile | null>(null);

  const [editPhone, setEditPhone] = useState("");
  const [editPhoneCountry, setEditPhoneCountry] = useState<Country>(
    "NG" as Country,
  );
  const [editEmployerType, setEditEmployerType] = useState("");
  const [editYearsInRole, setEditYearsInRole] = useState("");
  const [editMonthlyIncome, setEditMonthlyIncome] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const statusRes = await apiClient.get<{
          data: {
            kycStatus: string;
            isBlocked: boolean;
            blockedUntil: string | null;
          };
        }>("/parents/eligibility-status");
        const { kycStatus, isBlocked, blockedUntil } = statusRes.data.data;

        if (isBlocked) {
          setEligibilityProfile({
            firstName: "",
            lastName: "",
            middleName: null,
            dob: null,
            addressStreet: null,
            addressCity: null,
            addressLga: null,
            addressState: null,
            addressCountry: null,
            profilePhotoUrl: null,
            kycStatus,
            relationship: null,
            employerType: null,
            yearsInRole: null,
            monthlyIncome: null,
            eligibilityBlockedUntil: blockedUntil,
            email: "",
            phoneNumber: "",
          });
          setPageMode("blocked");
          return;
        }

        if (kycStatus === "approved") {
          const profileRes = await apiClient.get<{ data: EligibilityProfile }>(
            "/parents/eligibility-profile",
          );
          const p = profileRes.data.data;
          setEligibilityProfile(p);
          setEditPhone(p.phoneNumber ?? "");
          setEditEmployerType(p.employerType ?? "");
          setEditYearsInRole(p.yearsInRole ?? "");
          setEditMonthlyIncome(p.monthlyIncome ?? "");
          setEditPhotoUrl(p.profilePhotoUrl ?? "");
          setEditPhotoPreview(p.profilePhotoUrl ?? "");
          setPageMode("review");
          return;
        }

        setPageMode("wizard");
      } catch {
        setPageMode("wizard");
      }
    })();
  }, []);

  const handleEditPhotoSelect = (file: File) => {
    if (editPhotoPreview && !editPhotoPreview.startsWith("http"))
      URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
    setEditPhotoUrl("");
  };

  const handleSaveEligibilityProfile = async () => {
    setEditSaving(true);
    try {
      let photoUrl = editPhotoUrl;
      if (editPhotoFile) {
        const fd = new FormData();
        fd.append("file", editPhotoFile);
        const res = await apiClient.post<{ data: { url: string } }>(
          "/upload/document",
          fd,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        photoUrl = res.data.data.url;
        setEditPhotoUrl(photoUrl);
        setEditPhotoFile(null);
      }
      const updated = await apiClient.patch<{ data: EligibilityProfile }>(
        "/parents/eligibility-profile",
        {
          phoneNumber: editPhone || undefined,
          employerType: editEmployerType || undefined,
          yearsInRole: editYearsInRole || undefined,
          monthlyIncome: editMonthlyIncome || undefined,
          photoUrl: photoUrl || undefined,
        },
      );
      setEligibilityProfile(updated.data.data);
      setEditPhotoPreview(updated.data.data.profilePhotoUrl ?? "");
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast((err as { message?: string }).message ?? "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const [schools, setSchools] = useState<CatalogSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [institutionTypes, setInstitutionTypes] = useState<
    CatalogInstitutionType[]
  >([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classLevelGroups, setClassLevelGroups] = useState<
    CatalogClassLevelGroup[]
  >([]);

  const [state, setState] = useState<WizardState>({
    step: 0,
    step1: {
      fullName:
        user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      email: user?.email ?? "",
      phone: user?.phoneNumber ?? "",
      phoneCountry: "NG" as Country,
      relationship: "",
      employerType: "",
      yearsInRole: "",
      monthlyIncome: "",
      countryId: 0,
      stateId: 0,
      addressCountryName: "",
      addressState: "",
      addressLga: "",
      addressCity: "",
      addressStreet: "",
      dob: "",
      photoUrl: "",
      photoPreview: "",
      photoFile: null,
      photoUploading: false,
      spouse: {
        fullName: "",
        email: "",
        phone: "",
        phoneCountry: "NG" as Country,
        employerType: "",
      },
    },
    step2: {
      bvnOrNin: "bvn",
      bvn: "",
      nin: "",
      bvnStatus: "idle",
      ninStatus: "idle",
      ninData: null,
      selectedDocType: "",
      employerName: "",
      companyName: "",
      pendingFile: null,
      uploadedDocs: [],
      scoreCheckStatus: "idle",
    },
    step3: {
      institutionTypeId: "",
      institutionType: "",
      schoolId: "",
      schoolName: "",
      gradeLevel: "",
      repaymentPlan: "",
      academicSession: "",
      tuitionAmount: "",
    },
    step4: {
      students: [{ fullName: "", dob: "", gender: "", admissionNumber: "" }],
      termsConfirmed: false,
    },
    applicationRef: null,
    isSubmitting: false,
    showSuccess: false,
    isScoreChecking: false,
    scoreBlocked: false,
  });

  const patch = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const clearErr = (key: string) =>
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });

  useEffect(() => {
    if (state.step !== 2) return;
    setLoadingTypes(true);
    catalogService
      .getInstitutionTypes()
      .then(setInstitutionTypes)
      .catch(() =>
        showToast("Failed to load institution types. Please try again."),
      )
      .finally(() => setLoadingTypes(false));
  }, [state.step]);

  useEffect(() => {
    if (!state.step3.institutionTypeId) {
      setSchools([]);
      return;
    }
    setLoadingSchools(true);
    setSchools([]);
    catalogService
      .getSchools(state.step3.institutionTypeId)
      .then(setSchools)
      .catch(() => showToast("Failed to load schools. Please try again."))
      .finally(() => setLoadingSchools(false));
  }, [state.step3.institutionTypeId]);

  useEffect(() => {
    if (!state.step3.schoolId || !state.step3.institutionTypeId) {
      setClassLevelGroups([]);
      return;
    }
    setLoadingClasses(true);
    setClassLevelGroups([]);
    catalogService
      .getClassLevels(state.step3.schoolId, state.step3.institutionTypeId)
      .then(setClassLevelGroups)
      .catch(() => showToast("Failed to load class levels. Please try again."))
      .finally(() => setLoadingClasses(false));
  }, [state.step3.schoolId, state.step3.institutionTypeId]);

  const handlePhotoSelect = (file: File) => {
    if (state.step1.photoPreview) URL.revokeObjectURL(state.step1.photoPreview);
    const preview = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      step1: {
        ...prev.step1,
        photoFile: file,
        photoPreview: preview,
        photoUrl: "",
      },
    }));
    clearErr("photo");
  };

  const removePhoto = () => {
    if (state.step1.photoPreview) URL.revokeObjectURL(state.step1.photoPreview);
    setState((prev) => ({
      ...prev,
      step1: {
        ...prev.step1,
        photoFile: null,
        photoPreview: "",
        photoUrl: "",
        photoUploading: false,
      },
    }));
  };

  const handleFileSelect = (file: File) => {
    if (!state.step2.selectedDocType) return;
    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size:
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`,
      docType: state.step2.selectedDocType,
      file,
      status: "pending",
    };
    patch("step2", {
      ...state.step2,
      uploadedDocs: [...state.step2.uploadedDocs, newDoc],
      pendingFile: null,
    });
    clearErr("uploadedDocs");
    if (docFileInputRef.current) docFileInputRef.current.value = "";
  };

  const removeDoc = (id: string) =>
    patch("step2", {
      ...state.step2,
      uploadedDocs: state.step2.uploadedDocs.filter((d) => d.id !== id),
    });

  const handleVerifyNin = async () => {
    if (!/^\d{11}$/.test(state.step2.nin)) {
      setErrors((p) => ({ ...p, nin: "NIN must be exactly 11 digits." }));
      return;
    }
    patch("step2", { ...state.step2, ninStatus: "verifying", ninData: null });
    try {
      const data = await parentService.verifyNin(state.step2.nin);
      patch("step2", { ...state.step2, ninStatus: "verified", ninData: data });
      clearErr("nin");
    } catch (err) {
      patch("step2", { ...state.step2, ninStatus: "error", ninData: null });
      showToast(
        (err as { message?: string }).message ??
          "NIN verification failed. Please check the number.",
      );
    }
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    const s = state.step1;
    if (!s.phone.trim()) e.phone = "Phone number is required.";
    if (!s.relationship)
      e.relationship = "Please select your relationship to the student.";
    if (!s.employerType) e.employerType = "Please select your employment type.";
    if (!s.yearsInRole) e.yearsInRole = "Please select years in current role.";
    if (!s.monthlyIncome) e.monthlyIncome = "Please select your income range.";
    if (!s.dob) e.dob = "Date of birth is required.";
    if (!s.countryId) e.addressState = "Please select your country.";
    else if (!s.addressState)
      e.addressState = "Please select your state / region.";
    if (!s.addressCity) e.addressCity = "Please select your city / town.";
    if (!s.addressStreet.trim())
      e.addressStreet = "Street address is required.";
    if (!s.photoUrl && !s.photoFile) e.photo = "Please upload your photo.";
    if (!s.spouse.fullName.trim())
      e.spouseFullName = "Spouse full name is required.";
    if (!s.spouse.email.trim()) e.spouseEmail = "Spouse email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.spouse.email.trim()))
      e.spouseEmail = "Enter a valid email address.";
    if (!s.spouse.phone.trim())
      e.spousePhone = "Spouse phone number is required.";
    if (!s.spouse.employerType)
      e.spouseEmployerType = "Spouse employment type is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    const s = state.step2;
    if (s.bvnOrNin === "bvn") {
      if (!s.bvn.trim()) e.bvn = "BVN is required.";
      else if (!/^\d{11}$/.test(s.bvn.trim()))
        e.bvn = "BVN must be exactly 11 digits.";
    } else {
      if (!s.nin.trim()) e.nin = "NIN is required.";
      else if (!/^\d{11}$/.test(s.nin.trim()))
        e.nin = "NIN must be exactly 11 digits.";
      else if (s.ninStatus !== "verified")
        e.nin = "Please verify your NIN before continuing.";
    }
    if (s.uploadedDocs.length === 0)
      e.uploadedDocs = "Please upload at least one document.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    const s = state.step3;
    if (!s.institutionTypeId)
      e.institutionType = "Institution type is required.";
    if (!s.schoolId) e.schoolId = "Please select a school.";
    if (!s.gradeLevel) e.gradeLevel = "Class/level is required.";
    if (!s.repaymentPlan) e.repaymentPlan = "Please choose a repayment plan.";
    if (!s.academicSession) e.academicSession = "Academic session is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = (): boolean => {
    const e: Record<string, string> = {};
    state.step4.students.forEach((st, i) => {
      if (!st.fullName.trim()) e[`st_${i}_name`] = "Student name is required.";
      if (!st.dob.trim()) e[`st_${i}_dob`] = "Date of birth is required.";
      if (!st.gender) e[`st_${i}_gender`] = "Gender is required.";
      if (!st.admissionNumber.trim())
        e[`st_${i}_admission`] = "Admission / student ID is required.";
    });
    if (!state.step4.termsConfirmed)
      e.terms = "You must confirm the information is accurate.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitStep1 = async (): Promise<boolean> => {
    if (!validateStep1()) return false;
    return true;
  };

  const submitStep2 = async (): Promise<boolean> => {
    if (!validateStep2()) return false;
    const bvnToCheck =
      state.step2.bvnOrNin === "bvn"
        ? state.step2.bvn.trim()
        : ((state.step2.ninData as { bvn?: string } | null)?.bvn ?? "");

    if (bvnToCheck && /^\d{11}$/.test(bvnToCheck)) {
      patch("isScoreChecking", true);
      patch("step2", { ...state.step2, scoreCheckStatus: "checking" });
      try {
        const res = await apiClient.post<{
          data: {
            pass: boolean;
            decision: string;
            creditScore: string;
            advisoryAmount: number;
          };
        }>("/parents/score-check", {
          bvn: bvnToCheck,
          requestedAmount: 100,
          location: state.step1.addressState || "Lagos",
        });

        const { pass } = res.data.data;

        if (!pass) {
          setState((prev) => ({
            ...prev,
            isScoreChecking: false,
            scoreBlocked: true,
            step2: { ...prev.step2, scoreCheckStatus: "failed" },
          }));
          return false;
        }
        setState((prev) => ({
          ...prev,
          step2: { ...prev.step2, scoreCheckStatus: "passed" },
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          step2: { ...prev.step2, scoreCheckStatus: "idle" },
        }));
      } finally {
        patch("isScoreChecking", false);
      }
    }

    return true;
  };

  const submitStep3 = async (): Promise<boolean> => {
    if (!validateStep3()) return false;
    return true;
  };

  const submitStep4 = async (): Promise<void> => {
    if (!validateStep4()) return;
    patch("isSubmitting", true);

    try {
      let photoUrl = state.step1.photoUrl;
      if (state.step1.photoFile && !photoUrl) {
        setState((prev) => ({
          ...prev,
          step1: { ...prev.step1, photoUploading: true },
        }));
        const formData = new FormData();
        formData.append("file", state.step1.photoFile);
        const photoRes = await apiClient.post<{ data: { url: string } }>(
          "/upload/document",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        photoUrl = photoRes.data.data.url;
        setState((prev) => ({
          ...prev,
          step1: { ...prev.step1, photoUrl, photoUploading: false },
        }));
      }
      const uploadedDocUrls: Array<{ url: string; type_id: number }> = [];
      for (const doc of state.step2.uploadedDocs) {
        if ((doc as unknown as { url?: string }).url) {
          uploadedDocUrls.push({
            url: (doc as unknown as { url: string }).url,
            type_id: 1,
          });
        } else {
          const df = new FormData();
          df.append("file", doc.file);
          const docRes = await apiClient.post<{ data: { url: string } }>(
            "/upload/document",
            df,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          uploadedDocUrls.push({ url: docRes.data.data.url, type_id: 1 });
        }
      }
      await apiClient.put("/parents/profile", {
        dob: state.step1.dob,
        addressStreet: state.step1.addressStreet,
        addressCity: state.step1.addressCity,
        addressState: state.step1.addressState,
        addressLga: state.step1.addressLga,
        profilePhotoUrl: photoUrl || undefined,
      });

      const kycPayload =
        state.step2.bvnOrNin === "bvn"
          ? {
              bvn: state.step2.bvn,
              dob: state.step1.dob,
              state: state.step1.addressState,
              lga: state.step1.addressLga,
              city: state.step1.addressCity,
              address: state.step1.addressStreet,
              photoUrl: photoUrl || undefined,
              documents: uploadedDocUrls,
              relationship: state.step1.relationship,
              employerType: state.step1.employerType,
              yearsInRole: state.step1.yearsInRole,
              monthlyIncome: state.step1.monthlyIncome,
            }
          : {
              nin: state.step2.nin,
              dob: state.step1.dob,
              state: state.step1.addressState,
              lga: state.step1.addressLga,
              city: state.step1.addressCity,
              address: state.step1.addressStreet,
              photoUrl: photoUrl || undefined,
              documents: uploadedDocUrls,
              relationship: state.step1.relationship,
              employerType: state.step1.employerType,
              yearsInRole: state.step1.yearsInRole,
              monthlyIncome: state.step1.monthlyIncome,
            };

      await parentService.verifyKYC(kycPayload);

      const tuitionAmountNum = parseFloat(state.step3.tuitionAmount) || 0;
      const studentSaveErrors: string[] = [];

      for (const st of state.step4.students) {
        if (!st.fullName.trim()) continue;
        const nameParts = st.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] ?? "";
        const lastName = nameParts.slice(1).join(" ") || firstName;

        try {
          await parentService.addStudent({
            schoolId: state.step3.schoolId,
            firstName,
            lastName,
            studentId: st.admissionNumber || undefined,
            gradeLevel: state.step3.gradeLevel,
            tuitionAmount: tuitionAmountNum,
          });
        } catch (err) {
          studentSaveErrors.push(
            `${st.fullName}: ${(err as { message?: string }).message ?? "Save failed"}`,
          );
        }
      }

      if (studentSaveErrors.length > 0) {
        showToast(
          `KYC submitted. Some students could not be saved: ${studentSaveErrors.join("; ")}`,
        );
      }

      patch("showSuccess", true);
    } catch (err) {
      showToast(
        (err as { message?: string }).message ??
          "Application submission failed.",
      );
    } finally {
      patch("isSubmitting", false);
    }
  };

  const handleNext = async () => {
    setErrors({});
    if (state.step === 0) {
      const ok = await submitStep1();
      if (ok) patch("step", 1);
    } else if (state.step === 1) {
      const ok = await submitStep2();
      if (ok) patch("step", 2);
    } else if (state.step === 2) {
      const ok = await submitStep3();
      if (ok) patch("step", 3);
    } else {
      await submitStep4();
    }
  };

  const handleBack = () => {
    if (state.step > 0) patch("step", (state.step - 1) as Step);
    else navigate("/parent/dashboard");
  };

  const updateStudent = (i: number, field: keyof StudentEntry, val: string) => {
    const updated = state.step4.students.map((s, idx) =>
      idx === i ? { ...s, [field]: val } : s,
    );
    patch("step4", { ...state.step4, students: updated });
    clearErr(`st_${i}_${field}`);
  };

  const addStudent = () =>
    patch("step4", {
      ...state.step4,
      students: [
        ...state.step4.students,
        { fullName: "", dob: "", gender: "", admissionNumber: "" },
      ],
    });

  const removeStudent = (i: number) =>
    patch("step4", {
      ...state.step4,
      students: state.step4.students.filter((_, idx) => idx !== i),
    });

  if (pageMode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#8B1C53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageMode === "blocked") {
    const blockedUntil = eligibilityProfile?.eligibilityBlockedUntil;
    const formattedDate = blockedUntil
      ? new Date(blockedUntil).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#8B1C53] px-6 py-8 text-white text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-snug">
              Credit Check Failed
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Your account is temporarily restricted
            </p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              Unfortunately, your credit score does not meet the minimum
              requirement to use SkulCredit at this time.
            </p>
            {formattedDate && (
              <p className="mt-3 text-sm font-semibold text-[#8B1C53]">
                You can reapply from{" "}
                <span className="underline">{formattedDate}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              This restriction lifts automatically at the start of the next
              term. If you believe this is an error, please contact support.
            </p>
            <div className="mt-5 rounded-xl bg-[#fdf0f6] border border-[#f5c6d8] px-4 py-3 text-left">
              <p className="text-xs font-semibold text-[#8B1C53] mb-1">
                What happens next?
              </p>
              <ul className="text-xs text-[#8B1C53]/80 space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  Your application portal access is restricted until the next
                  term.
                </li>
                <li>You cannot submit new loan applications at this time.</li>
                <li>Contact support if you have questions about your score.</li>
              </ul>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={() => navigate("/parent/dashboard")}
              className="w-full rounded-full bg-[#8B1C53] py-3 text-sm font-bold text-white hover:bg-[#7a1848] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageMode === "review" && eligibilityProfile) {
    const ep = eligibilityProfile;
    const fullName = [ep.firstName, ep.middleName, ep.lastName]
      .filter(Boolean)
      .join(" ");
    const displayPhoto = editPhotoPreview || ep.profilePhotoUrl;

    return (
      <div className="flex flex-col min-h-full animate-fade-in-up">
        <Toast
          message={toast.message}
          visible={toast.visible}
          onDismiss={dismissToast}
        />
        <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white px-6 sm:px-10 py-8 mt-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Eligibility Profile
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                KYC verified. You can update the editable fields below.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                Personal Details
              </p>

              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#8B1C53]/30 shrink-0 bg-gray-100 flex items-center justify-center">
                  {displayPhoto ? (
                    <img
                      src={resolveUploadUrl(displayPhoto)}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10 text-gray-300"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500">
                    Profile Photo{" "}
                    <span className="text-[#8B1C53] font-semibold">
                      (editable)
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="rounded-full border border-[#8B1C53] px-4 py-1.5 text-xs font-semibold text-[#8B1C53] hover:bg-[#8B1C53]/5 transition-colors"
                    >
                      Change Photo
                    </button>
                    {(editPhotoFile || editPhotoPreview) &&
                      editPhotoPreview !== ep.profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotoFile(null);
                            setEditPhotoPreview(ep.profilePhotoUrl ?? "");
                            setEditPhotoUrl(ep.profilePhotoUrl ?? "");
                          }}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Revert
                        </button>
                      )}
                  </div>
                  <input
                    ref={editPhotoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleEditPhotoSelect(f);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Full Name
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {fullName || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Email
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.email || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.dob || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Relationship to Student
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.relationship || "—"}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  Phone Number{" "}
                  <span className="text-[#8B1C53] font-semibold">
                    (editable)
                  </span>
                </label>
                <PhoneField
                  value={editPhone}
                  country={editPhoneCountry}
                  placeholder="Enter your phone number"
                  onChange={setEditPhone}
                  onCountryChange={setEditPhoneCountry}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                Address
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Country
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.addressCountry || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    State
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.addressState || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    City
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.addressCity || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    LGA
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.addressLga || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">
                    Street Address
                  </label>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {ep.addressStreet || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
                Employment &amp; Income
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  Employer / Business Type{" "}
                  <span className="text-[#8B1C53] font-semibold">
                    (editable)
                  </span>
                </label>
                <SelectWithChevron
                  value={editEmployerType}
                  onChange={setEditEmployerType}
                  placeholder="-Select your employment type-"
                  options={EMPLOYER_TYPES}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  Years in Current Role{" "}
                  <span className="text-[#8B1C53] font-semibold">
                    (editable)
                  </span>
                </label>
                <SelectWithChevron
                  value={editYearsInRole}
                  onChange={setEditYearsInRole}
                  placeholder="-Select years of experience-"
                  options={YEARS_OPTIONS}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  Monthly Income (₦){" "}
                  <span className="text-[#8B1C53] font-semibold">
                    (editable)
                  </span>
                </label>
                <SelectWithChevron
                  value={editMonthlyIncome}
                  onChange={setEditMonthlyIncome}
                  placeholder="-Select your income range-"
                  options={INCOME_RANGES}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate("/parent/dashboard")}
                className="flex items-center gap-1.5 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <BackIcon /> Back to Dashboard
              </button>
              <button
                type="button"
                onClick={handleSaveEligibilityProfile}
                disabled={editSaving}
                className="rounded-full bg-[#8B1C53] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.scoreBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-[#8B1C53] px-6 py-6 text-white text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7 text-white"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold leading-snug">
              Credit Score Too Low
            </h2>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              Unfortunately, your credit score does not meet the minimum
              requirement to use SkulCredit at this time.
            </p>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              You may re-apply in the next school term or session once your
              credit standing has improved. If you believe this is an error,
              please contact support.
            </p>

            <div className="mt-6 rounded-xl bg-[#fdf0f6] border border-[#f5c6d8] px-4 py-3 text-left">
              <p className="text-xs font-semibold text-[#8B1C53] mb-1">
                What happens next?
              </p>
              <ul className="text-xs text-[#8B1C53]/80 space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  Your account has been flagged and temporarily restricted.
                </li>
                <li>You cannot submit new loan applications at this time.</li>
                <li>Contact support if you have questions about your score.</li>
              </ul>
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={() => navigate("/parent/dashboard")}
              className="w-full rounded-full bg-[#8B1C53] py-3 text-sm font-bold text-white hover:bg-[#7a1848] transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.showSuccess) {
    const NEXT_STEPS = [
      "Our team will review your application within 24–48 hours",
      "We may contact you for additional information if needed",
      "Once approved, funds will be disbursed directly to the school",
      "You'll receive an email with your repayment schedule",
    ];
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white px-8 sm:px-12 py-14 text-center">
          <div className="flex justify-center mb-6">
            <SubmitCheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-[#8B1C53]">
            Application Submitted Successfully!
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Your application has been received and is under review
          </p>
          {state.applicationRef && (
            <p className="mt-1 text-xs font-mono text-gray-400">
              Ref: {state.applicationRef}
            </p>
          )}
          <div className="mt-8">
            <p className="text-sm font-bold text-center mb-5 text-[#8B1C53]">
              What Happens Next?
            </p>
            <ul className="flex flex-col gap-3 text-left">
              {NEXT_STEPS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-gray-600"
                >
                  <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate("/parent/dashboard")}
            className="mt-10 w-full rounded-full py-3.5 text-sm font-semibold text-white bg-[#8B1C53] hover:bg-[#7a1848] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full animate-fade-in-up">
      <Toast
        message={toast.message}
        visible={toast.visible}
        onDismiss={dismissToast}
      />

      <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white px-6 sm:px-10 py-8 mt-8 mb-12">
        <StepIndicator current={state.step} />
        {state.step === 0 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Parent Information/Guardian
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ready to finance your child's school fees with flexibility?
                Let's start with your parent/guardian details.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              <Field
                label="Full Name"
                hint="Auto-filled from signup and cannot be edited"
              >
                <input
                  value={state.step1.fullName}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </Field>
              <Field
                label="Email Address"
                hint="We'll use this email to send you updates about your application."
              >
                <input
                  value={state.step1.email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </Field>
              <Field
                label="Phone Number"
                required
                error={errors.phone}
                hint="Enter your country code"
              >
                <PhoneField
                  value={state.step1.phone}
                  country={state.step1.phoneCountry}
                  placeholder="Enter your phone number"
                  error={!!errors.phone}
                  onChange={(v) => {
                    patch("step1", { ...state.step1, phone: v });
                    clearErr("phone");
                  }}
                  onCountryChange={(c) => {
                    patch("step1", { ...state.step1, phoneCountry: c });
                  }}
                />
              </Field>
              <Field
                label="Date of Birth"
                required
                error={errors.dob}
                hint="Parent/guardian's date of birth"
              >
                <input
                  type="date"
                  value={state.step1.dob}
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18),
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) => {
                    patch("step1", { ...state.step1, dob: e.target.value });
                    clearErr("dob");
                  }}
                  className={inputCls(errors.dob)}
                />
              </Field>
              <Field
                label="Relationship to Student"
                required
                error={errors.relationship}
                hint="Choose if you're the parent, guardian, or sponsor"
              >
                <SelectWithChevron
                  value={state.step1.relationship}
                  onChange={(v) => {
                    patch("step1", { ...state.step1, relationship: v });
                    clearErr("relationship");
                  }}
                  placeholder="-Select Relationship-"
                  options={RELATIONSHIPS}
                  error={errors.relationship}
                />
              </Field>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Profile Photo <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload a clear photo of your face. JPG or PNG, up to 5 MB.
                </p>
              </div>

              {state.step1.photoPreview ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#8B1C53]/30 shrink-0">
                    <img
                      src={resolveUploadUrl(state.step1.photoPreview)}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                    {state.step1.photoUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {state.step1.photoUploading ? (
                      <p className="text-xs text-gray-500">Uploading…</p>
                    ) : state.step1.photoUrl ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckIcon className="w-3.5 h-3.5" /> Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <CheckIcon className="w-3.5 h-3.5" /> Photo selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={state.step1.photoUploading}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                    >
                      <TrashIcon /> Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-colors border-gray-300 hover:border-[#8B1C53]/50 bg-white ${errors.photo ? "border-red-400 bg-red-50" : ""}`}
                  onClick={() => photoFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handlePhotoSelect(f);
                  }}
                  role="button"
                  aria-label="Upload profile photo"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      photoFileInputRef.current?.click();
                    }
                  }}
                >
                  <UserPhotoIcon />
                  <p className="text-sm font-medium text-gray-600">
                    Click or drag to upload your photo
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG or PNG – up to 5 MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      photoFileInputRef.current?.click();
                    }}
                    className="mt-1 rounded-full bg-[#8B1C53] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#7a1848] transition-colors"
                  >
                    Browse
                  </button>
                </div>
              )}
              {errors.photo && (
                <p role="alert" className="text-xs text-red-500">
                  {errors.photo}
                </p>
              )}
              <input
                ref={photoFileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoSelect(f);
                }}
              />
            </div>

            {/* ── Employment details ── */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              {/* Employer / Business Type */}
              <Field
                label="Employer / Business Type"
                required
                error={errors.employerType}
                hint="This helps us understand your source of repayment."
              >
                <SelectWithChevron
                  value={state.step1.employerType}
                  onChange={(v) => {
                    patch("step1", { ...state.step1, employerType: v });
                    clearErr("employerType");
                  }}
                  placeholder="-Select your employment type-"
                  options={EMPLOYER_TYPES}
                  error={errors.employerType}
                />
              </Field>

              {/* Years in Current Role */}
              <Field
                label="Years in Current Role"
                required
                error={errors.yearsInRole}
              >
                <SelectWithChevron
                  value={state.step1.yearsInRole}
                  onChange={(v) => {
                    patch("step1", { ...state.step1, yearsInRole: v });
                    clearErr("yearsInRole");
                  }}
                  placeholder="-Select years of experience-"
                  options={YEARS_OPTIONS}
                  error={errors.yearsInRole}
                />
              </Field>

              {/* Monthly Income */}
              <Field
                label="Monthly Income (₦)"
                required
                error={errors.monthlyIncome}
              >
                <SelectWithChevron
                  value={state.step1.monthlyIncome}
                  onChange={(v) => {
                    patch("step1", { ...state.step1, monthlyIncome: v });
                    clearErr("monthlyIncome");
                  }}
                  placeholder="-Select your income range-"
                  options={INCOME_RANGES}
                  error={errors.monthlyIncome}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-[#8B1C53]/20 bg-white p-5 flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Spouse / Partner Details{" "}
                  <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Provide your spouse or partner's information. All fields are
                  required.
                </p>
              </div>
              <Field
                label="Spouse Full Name"
                required
                error={errors.spouseFullName}
              >
                <input
                  value={state.step1.spouse.fullName}
                  placeholder="E.g. Amaka Johnson"
                  onChange={(e) => {
                    patch("step1", {
                      ...state.step1,
                      spouse: {
                        ...state.step1.spouse,
                        fullName: e.target.value,
                      },
                    });
                    clearErr("spouseFullName");
                  }}
                  className={inputCls(errors.spouseFullName)}
                />
              </Field>
              <Field
                label="Spouse Email Address"
                required
                error={errors.spouseEmail}
              >
                <input
                  type="email"
                  value={state.step1.spouse.email}
                  placeholder="E.g. amaka@example.com"
                  onChange={(e) => {
                    patch("step1", {
                      ...state.step1,
                      spouse: { ...state.step1.spouse, email: e.target.value },
                    });
                    clearErr("spouseEmail");
                  }}
                  className={inputCls(errors.spouseEmail)}
                />
              </Field>
              <Field
                label="Spouse Phone Number"
                required
                error={errors.spousePhone}
                hint="Enter country code and phone number"
              >
                <PhoneField
                  value={state.step1.spouse.phone}
                  country={state.step1.spouse.phoneCountry}
                  placeholder="Enter spouse phone number"
                  error={!!errors.spousePhone}
                  onChange={(v) => {
                    patch("step1", {
                      ...state.step1,
                      spouse: { ...state.step1.spouse, phone: v },
                    });
                    clearErr("spousePhone");
                  }}
                  onCountryChange={(c) => {
                    patch("step1", {
                      ...state.step1,
                      spouse: { ...state.step1.spouse, phoneCountry: c },
                    });
                  }}
                />
              </Field>
              <Field
                label="Spouse Employment Type"
                required
                error={errors.spouseEmployerType}
              >
                <SelectWithChevron
                  value={state.step1.spouse.employerType}
                  onChange={(v) => {
                    patch("step1", {
                      ...state.step1,
                      spouse: { ...state.step1.spouse, employerType: v },
                    });
                    clearErr("spouseEmployerType");
                  }}
                  placeholder="-Select employment type-"
                  options={EMPLOYER_TYPES}
                  error={errors.spouseEmployerType}
                />
              </Field>
            </div>

            {/* ── Address (cascading) ── */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Residential Address
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your full residential address for verification purposes.
                </p>
              </div>

              {/* Country */}
              <Field label="Country" required error={errors.addressState}>
                <div
                  className={`[&_.stdropdown-container]:w-full [&_.stdropdown-container]:!rounded-lg [&_.stdropdown-container]:!border [&_.stdropdown-container]:!border-gray-200 [&_.stdropdown-container]:!bg-white [&_.stdropdown-container:hover]:!border-gray-300 [&_.stdropdown-container:focus-within]:!border-[#8B1C53] [&_.stdropdown-container:focus-within]:!ring-2 [&_.stdropdown-container:focus-within]:!ring-[#8B1C53]/20 [&_.stdropdown-input]:!w-full [&_.stdropdown-input]:px-3 [&_.stdropdown-input]:py-2.5 [&_.stdropdown-input_input]:!w-full [&_.stdropdown-input_input]:!border-none [&_.stdropdown-input_input]:!rounded-none [&_.stdropdown-input_input]:!shadow-none [&_.stdropdown-input_input]:!outline-none [&_.stdropdown-input_input]:!ring-0 [&_.stdropdown-input_input]:!bg-transparent [&_.stdropdown-input_input]:!p-0 [&_.stdropdown-input_input]:text-sm ${errors.addressState ? "[&_.stdropdown-container]:!border-red-400" : ""}`}
                >
                  <CountrySelect
                    containerClassName="w-full"
                    inputClassName="w-full"
                    onChange={(val) => {
                      const country = val as {
                        id: number;
                        name: string;
                      } | null;
                      setState((prev) => ({
                        ...prev,
                        step1: {
                          ...prev.step1,
                          countryId: country?.id ?? 0,
                          addressCountryName: country?.name ?? "",
                          stateId: 0,
                          addressState: "",
                          addressCity: "",
                        },
                      }));
                      clearErr("addressState");
                    }}
                    placeHolder="Select Country"
                  />
                </div>
              </Field>

              {/* State / Region */}
              <Field
                label="State / Region"
                required
                error={errors.addressState}
              >
                <div
                  className={`[&_.stdropdown-container]:w-full [&_.stdropdown-container]:!rounded-lg [&_.stdropdown-container]:!border [&_.stdropdown-container]:!border-gray-200 [&_.stdropdown-container]:!bg-white [&_.stdropdown-container:hover]:!border-gray-300 [&_.stdropdown-container:focus-within]:!border-[#8B1C53] [&_.stdropdown-container:focus-within]:!ring-2 [&_.stdropdown-container:focus-within]:!ring-[#8B1C53]/20 [&_.stdropdown-input]:!w-full [&_.stdropdown-input]:px-3 [&_.stdropdown-input]:py-2.5 [&_.stdropdown-input_input]:!w-full [&_.stdropdown-input_input]:!border-none [&_.stdropdown-input_input]:!rounded-none [&_.stdropdown-input_input]:!shadow-none [&_.stdropdown-input_input]:!outline-none [&_.stdropdown-input_input]:!ring-0 [&_.stdropdown-input_input]:!bg-transparent [&_.stdropdown-input_input]:!p-0 [&_.stdropdown-input_input]:text-sm ${errors.addressState ? "[&_.stdropdown-container]:!border-red-400" : ""}`}
                >
                  <StateSelect
                    key={`state-${state.step1.countryId}`}
                    countryid={state.step1.countryId}
                    containerClassName="w-full"
                    inputClassName="w-full"
                    onChange={(val) => {
                      const s = val as { id: number; name: string } | null;
                      setState((prev) => ({
                        ...prev,
                        step1: {
                          ...prev.step1,
                          stateId: s?.id ?? 0,
                          addressState: s?.name ?? "",
                          addressCity: "",
                        },
                      }));
                      clearErr("addressState");
                    }}
                    placeHolder={
                      state.step1.countryId
                        ? "--Select--"
                        : "Select a country first"
                    }
                    disabled={!state.step1.countryId}
                  />
                </div>
                {errors.addressState && (
                  <p role="alert" className="text-xs text-red-500">
                    {errors.addressState}
                  </p>
                )}
              </Field>
              <Field label="City / Town" required error={errors.addressCity}>
                <div
                  className={`[&_.stdropdown-container]:w-full [&_.stdropdown-container]:!rounded-lg [&_.stdropdown-container]:!border [&_.stdropdown-container]:!border-gray-200 [&_.stdropdown-container]:!bg-white [&_.stdropdown-container:hover]:!border-gray-300 [&_.stdropdown-container:focus-within]:!border-[#8B1C53] [&_.stdropdown-container:focus-within]:!ring-2 [&_.stdropdown-container:focus-within]:!ring-[#8B1C53]/20 [&_.stdropdown-input]:!w-full [&_.stdropdown-input]:px-3 [&_.stdropdown-input]:py-2.5 [&_.stdropdown-input_input]:!w-full [&_.stdropdown-input_input]:!border-none [&_.stdropdown-input_input]:!rounded-none [&_.stdropdown-input_input]:!shadow-none [&_.stdropdown-input_input]:!outline-none [&_.stdropdown-input_input]:!ring-0 [&_.stdropdown-input_input]:!bg-transparent [&_.stdropdown-input_input]:!p-0 [&_.stdropdown-input_input]:text-sm ${errors.addressCity ? "[&_.stdropdown-container]:!border-red-400" : ""}`}
                >
                  <CitySelect
                    key={`city-${state.step1.countryId}-${state.step1.stateId}`}
                    countryid={state.step1.countryId}
                    stateid={state.step1.stateId}
                    containerClassName="w-full"
                    inputClassName="w-full"
                    onChange={(val) => {
                      const c = val as { name: string } | null;
                      setState((prev) => ({
                        ...prev,
                        step1: { ...prev.step1, addressCity: c?.name ?? "" },
                      }));
                      clearErr("addressCity");
                    }}
                    placeHolder={
                      state.step1.stateId
                        ? "--Select--"
                        : "Select a state first"
                    }
                    disabled={!state.step1.stateId}
                  />
                </div>
                {errors.addressCity && (
                  <p role="alert" className="text-xs text-red-500">
                    {errors.addressCity}
                  </p>
                )}
              </Field>
              <Field
                label="Local Government Area (LGA)"
                error={errors.addressLga}
                hint="If applicable — e.g. Agege, Surulere, Ikeja"
              >
                <input
                  value={state.step1.addressLga}
                  placeholder="Enter your LGA"
                  onChange={(e) => {
                    patch("step1", {
                      ...state.step1,
                      addressLga: e.target.value,
                    });
                    clearErr("addressLga");
                  }}
                  className={inputCls(errors.addressLga)}
                />
              </Field>

              <Field
                label="Street Address"
                required
                error={errors.addressStreet}
                hint="House number, street name, and any additional details"
              >
                <input
                  value={state.step1.addressStreet}
                  placeholder="E.g. 12 Bode Thomas Street, Surulere"
                  onChange={(e) => {
                    patch("step1", {
                      ...state.step1,
                      addressStreet: e.target.value,
                    });
                    clearErr("addressStreet");
                  }}
                  className={inputCls(errors.addressStreet)}
                />
              </Field>
            </div>
          </div>
        )}

        {state.step === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Identity &amp; Document Verification
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Verify your identity and upload required documents
              </p>
            </div>
            <VerificationTracker
              items={[
                {
                  label: "BVN / NIN Verification",
                  sublabel:
                    state.step2.bvnOrNin === "bvn"
                      ? state.step2.bvnStatus === "verified"
                        ? "just now"
                        : state.step2.bvnStatus === "error"
                          ? "verification failed"
                          : "awaiting submission"
                      : state.step2.ninStatus === "verified"
                        ? "just now"
                        : state.step2.ninStatus === "verifying"
                          ? "in progress…"
                          : state.step2.ninStatus === "error"
                            ? "verification failed"
                            : "awaiting submission",
                  status:
                    state.step2.bvnOrNin === "bvn"
                      ? state.step2.bvnStatus
                      : state.step2.ninStatus === "verifying"
                        ? "verifying"
                        : state.step2.ninStatus,
                },
                {
                  label: "Credit Score Check",
                  sublabel:
                    state.step2.scoreCheckStatus === "passed"
                      ? "just now"
                      : state.step2.scoreCheckStatus === "failed"
                        ? "score below threshold"
                        : state.step2.scoreCheckStatus === "checking"
                          ? "in progress…"
                          : "runs on submit",
                  status:
                    state.step2.scoreCheckStatus === "checking"
                      ? "checking"
                      : state.step2.scoreCheckStatus === "passed"
                        ? "passed"
                        : state.step2.scoreCheckStatus === "failed"
                          ? "failed"
                          : "idle",
                },
                {
                  label: "Loan Score Evaluation",
                  sublabel:
                    state.step2.scoreCheckStatus === "passed"
                      ? "just now"
                      : state.step2.scoreCheckStatus === "failed"
                        ? "not eligible at this time"
                        : state.step2.scoreCheckStatus === "checking"
                          ? "in progress…"
                          : "runs after credit check",
                  status:
                    state.step2.scoreCheckStatus === "passed"
                      ? "passed"
                      : state.step2.scoreCheckStatus === "failed"
                        ? "failed"
                        : state.step2.scoreCheckStatus === "checking"
                          ? "checking"
                          : "idle",
                },
              ]}
            />
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Identity Verification
                </p>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Verify your identity using your BVN or NIN for faster processing
              </p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(["bvn", "nin"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      patch("step2", { ...state.step2, bvnOrNin: tab })
                    }
                    className={[
                      "flex-1 py-2.5 text-sm font-semibold transition-colors",
                      state.step2.bvnOrNin === tab
                        ? "bg-[#8B1C53] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {tab.toUpperCase()} Verification
                  </button>
                ))}
              </div>
              {state.step2.bvnOrNin === "bvn" && (
                <Field
                  label="Bank Verification Number (BVN)"
                  required
                  error={errors.bvn}
                >
                  <div
                    className={`flex rounded-lg border overflow-hidden ${
                      state.step2.bvnStatus === "error"
                        ? "border-red-300 bg-red-50"
                        : errors.bvn
                          ? "border-red-400"
                          : "border-gray-200"
                    }`}
                  >
                    {state.step2.bvnStatus === "error" ? (
                      <div className="flex-1 px-3 py-2.5 flex items-start gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 mt-0.5 shrink-0"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-red-600">
                            We couldn't verify this BVN
                          </p>
                          <p className="text-xs text-red-500">
                            Check the number and try again, or use your NIN
                            instead.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            patch("step2", {
                              ...state.step2,
                              bvnStatus: "idle",
                              bvn: "",
                            })
                          }
                          className="ml-auto text-gray-400 hover:text-gray-600 shrink-0"
                          aria-label="Retry BVN"
                        >
                          <RefreshIcon />
                        </button>
                      </div>
                    ) : (
                      <input
                        value={state.step2.bvn}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder="Enter your 11-digit BVN"
                        onChange={(e) => {
                          patch("step2", {
                            ...state.step2,
                            bvn: e.target.value.replace(/\D/g, ""),
                            bvnStatus: "idle",
                          });
                          clearErr("bvn");
                        }}
                        className="flex-1 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Your BVN will be verified when you submit this step.
                  </p>
                  {state.step2.bvnStatus === "error" && (
                    <p className="text-xs text-gray-400">
                      Visit your nearest BVN enrollment center or use your NIN
                      instead.
                    </p>
                  )}
                </Field>
              )}
              {state.step2.bvnOrNin === "nin" && (
                <Field
                  label="National Identification Number (NIN)"
                  required
                  error={errors.nin}
                >
                  <div
                    className={`flex rounded-lg border overflow-hidden ${errors.nin ? "border-red-400" : "border-gray-200"}`}
                  >
                    <input
                      value={state.step2.nin}
                      maxLength={11}
                      inputMode="numeric"
                      placeholder="Enter your 11-digit NIN"
                      disabled={
                        state.step2.ninStatus === "verifying" ||
                        state.step2.ninStatus === "verified"
                      }
                      onChange={(e) => {
                        patch("step2", {
                          ...state.step2,
                          nin: e.target.value.replace(/\D/g, ""),
                          ninStatus: "idle",
                          ninData: null,
                        });
                        clearErr("nin");
                      }}
                      className="flex-1 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none disabled:opacity-60"
                    />
                    {state.step2.ninStatus === "verified" ? (
                      <button
                        type="button"
                        onClick={() =>
                          patch("step2", {
                            ...state.step2,
                            nin: "",
                            ninStatus: "idle",
                            ninData: null,
                          })
                        }
                        className="shrink-0 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-[#8B1C53] border-l border-gray-200 bg-gray-50 transition-colors flex items-center gap-1"
                        aria-label="Clear NIN and re-enter"
                      >
                        <RefreshIcon /> Change
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyNin}
                        disabled={state.step2.ninStatus === "verifying"}
                        className="shrink-0 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-[#8B1C53] border-l border-gray-200 bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {state.step2.ninStatus === "verifying"
                          ? "Verifying…"
                          : "Verify"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    11-digit NIN from your NIMC slip or National ID card
                  </p>
                  {state.step2.ninStatus === "verified" &&
                    state.step2.ninData && (
                      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          {state.step2.ninData.image_url && (
                            <img
                              src={state.step2.ninData.image_url}
                              alt="NIN photo"
                              className="h-12 w-12 rounded-full object-cover border border-green-300 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-green-700 flex items-center gap-1">
                              <CheckIcon className="w-4 h-4" /> NIN Verified
                            </p>
                            <p className="text-xs text-green-600">
                              {[
                                state.step2.ninData.first_name,
                                state.step2.ninData.middle_name,
                                state.step2.ninData.last_name,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
                          {state.step2.ninData.dob && (
                            <span>
                              <span className="text-green-500">DOB:</span>{" "}
                              {state.step2.ninData.formatted_dob ||
                                state.step2.ninData.dob}
                            </span>
                          )}
                          {state.step2.ninData.gender && (
                            <span>
                              <span className="text-green-500">Gender:</span>{" "}
                              {state.step2.ninData.gender}
                            </span>
                          )}
                          {state.step2.ninData.mobile && (
                            <span>
                              <span className="text-green-500">Phone:</span>{" "}
                              {state.step2.ninData.mobile}
                            </span>
                          )}
                          {state.step2.ninData.state_of_residence && (
                            <span>
                              <span className="text-green-500">State:</span>{" "}
                              {state.step2.ninData.state_of_residence}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  {state.step2.ninStatus === "error" && (
                    <p className="text-xs text-red-500 mt-1">
                      Verification failed. Please check your NIN and try again.
                    </p>
                  )}
                </Field>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  Upload documents
                </p>
                <span className="text-xs text-gray-400">
                  {state.step2.uploadedDocs.length} of 3 required
                </span>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Choose a document type, then upload the file. We accept PDF,
                JPG, or PNG.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Document type
                </label>
                <SelectWithChevron
                  value={state.step2.selectedDocType}
                  onChange={(v) =>
                    patch("step2", {
                      ...state.step2,
                      selectedDocType: v,
                      employerName:
                        v === "Utility Bill (Proof of Address"
                          ? ""
                          : state.step2.employerName,
                      companyName:
                        v === "Utility Bill (Proof of Address"
                          ? ""
                          : state.step2.companyName,
                    })
                  }
                  placeholder="Select document type"
                  options={DOCUMENT_TYPES}
                />
              </div>
              {(state.step2.selectedDocType ===
                "Bank Statement (Last 3 Months)" ||
                state.step2.selectedDocType ===
                  "Employment Letter or Business registration") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Name of Employer
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.step2.employerName}
                      onChange={(e) =>
                        patch("step2", {
                          ...state.step2,
                          employerName: e.target.value,
                        })
                      }
                      placeholder="e.g. John Adebayo"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Company / Organisation
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.step2.companyName}
                      onChange={(e) =>
                        patch("step2", {
                          ...state.step2,
                          companyName: e.target.value,
                        })
                      }
                      placeholder="e.g. Zenith Logistics Ltd"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
                    />
                  </div>
                </div>
              )}
              <div
                className={`rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-10 ${
                  state.step2.selectedDocType
                    ? "border-gray-300 hover:border-[#8B1C53]/50 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
                onClick={() =>
                  state.step2.selectedDocType &&
                  docFileInputRef.current?.click()
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f && state.step2.selectedDocType) handleFileSelect(f);
                }}
                role="button"
                aria-label="Upload document"
                tabIndex={state.step2.selectedDocType ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    state.step2.selectedDocType &&
                      docFileInputRef.current?.click();
                  }
                }}
              >
                <UploadCloudIcon />
                <p
                  className={`text-sm font-medium ${state.step2.selectedDocType ? "text-gray-600" : "text-gray-400"}`}
                >
                  {state.step2.selectedDocType
                    ? "Click or drag a file here"
                    : "Select a document type to enable upload"}
                </p>
                <p className="text-xs text-gray-400">
                  PDF, JPG, or PNG – up to 10 MB
                </p>
                <button
                  type="button"
                  disabled={!state.step2.selectedDocType}
                  onClick={(e) => {
                    e.stopPropagation();
                    docFileInputRef.current?.click();
                  }}
                  className="mt-2 rounded-full bg-[#8B1C53] px-6 py-2 text-sm font-semibold text-white hover:bg-[#7a1848] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Browse
                </button>
                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>

              {errors.uploadedDocs && (
                <p role="alert" className="text-xs text-red-500">
                  {errors.uploadedDocs}
                </p>
              )}
            </div>
            {state.step2.uploadedDocs.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-800">
                  Uploaded documents
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-[1fr_100px_80px] bg-[#FBF4FD] px-4 py-2.5 text-xs font-semibold text-[#8B1C53]">
                    <span>Document</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {state.step2.uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-[1fr_100px_80px] items-center px-4 py-3 border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PaperclipIcon />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-400">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        {doc.status === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-600">
                            <CheckIcon className="w-3 h-3" /> Verified
                          </span>
                        ) : doc.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-600">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Hide document"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <EyeOffIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDoc(doc.id)}
                          aria-label="Remove document"
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Choose School &amp; School fee Plan
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select your child's school and choose a tuition plan that fits
                your needs.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              <Field
                label="Institution Type"
                required
                error={errors.institutionType}
                hint="Choose whether your child attends a nursery, primary, secondary, or tertiary institution."
              >
                <div className="relative">
                  <select
                    value={state.step3.institutionTypeId}
                    disabled={loadingTypes}
                    onChange={(e) => {
                      const selected = institutionTypes.find(
                        (t) => t.id === e.target.value,
                      );
                      patch("step3", {
                        ...state.step3,
                        institutionTypeId: e.target.value,
                        institutionType: selected?.name ?? "",
                        schoolId: "",
                        schoolName: "",
                        gradeLevel: "",
                      });
                      clearErr("institutionType");
                    }}
                    className={
                      selectCls(errors.institutionType) +
                      (loadingTypes ? " opacity-60 cursor-wait" : "")
                    }
                  >
                    <option value="">
                      {loadingTypes ? "Loading…" : "-Select institution level-"}
                    </option>
                    {institutionTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </Field>
              <Field
                label="Choose Student School"
                required
                error={errors.schoolId}
                hint={
                  !state.step3.institutionTypeId
                    ? "Select an institution type first"
                    : "Schools available for the selected institution type"
                }
              >
                <div className="relative">
                  <select
                    value={state.step3.schoolId}
                    disabled={!state.step3.institutionTypeId || loadingSchools}
                    onChange={(e) => {
                      const selected = schools.find(
                        (s) => s.id === e.target.value,
                      );
                      patch("step3", {
                        ...state.step3,
                        schoolId: e.target.value,
                        schoolName: selected?.name ?? "",
                        gradeLevel: "",
                      });
                      clearErr("schoolId");
                    }}
                    className={
                      selectCls(errors.schoolId) +
                      (!state.step3.institutionTypeId || loadingSchools
                        ? " opacity-60 cursor-not-allowed"
                        : "")
                    }
                  >
                    <option value="">
                      {loadingSchools
                        ? "Loading schools…"
                        : !state.step3.institutionTypeId
                          ? "Select institution type first"
                          : schools.length === 0
                            ? "No schools available"
                            : "-Choose School-"}
                    </option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </Field>
              <Field
                label="Class/Level"
                required
                error={errors.gradeLevel}
                hint={
                  !state.step3.schoolId
                    ? "Select a school first"
                    : "Choose the student's current class or level"
                }
              >
                <div className="relative">
                  <select
                    value={state.step3.gradeLevel}
                    disabled={!state.step3.schoolId || loadingClasses}
                    onChange={(e) => {
                      patch("step3", {
                        ...state.step3,
                        gradeLevel: e.target.value,
                      });
                      clearErr("gradeLevel");
                    }}
                    className={
                      selectCls(errors.gradeLevel) +
                      (!state.step3.schoolId || loadingClasses
                        ? " opacity-60 cursor-not-allowed"
                        : "")
                    }
                  >
                    <option value="">
                      {loadingClasses
                        ? "Loading classes…"
                        : !state.step3.schoolId
                          ? "Select a school first"
                          : "-Choose Student Class/Level-"}
                    </option>
                    {classLevelGroups.map((group) =>
                      group.subLevelGroup ? (
                        <optgroup
                          key={group.subLevelGroup}
                          label={group.subLevelGroup}
                        >
                          {group.classes.map((cls) => (
                            <option key={cls.id} value={cls.name}>
                              {cls.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        group.classes.map((cls) => (
                          <option key={cls.id} value={cls.name}>
                            {cls.name}
                          </option>
                        ))
                      ),
                    )}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </Field>

              <Field
                label="Choose Repayment Plan"
                required
                error={errors.repaymentPlan}
                hint="Select a flexible repayment option that works for you"
              >
                <SelectWithChevron
                  value={state.step3.repaymentPlan}
                  onChange={(v) => {
                    patch("step3", { ...state.step3, repaymentPlan: v });
                    clearErr("repaymentPlan");
                  }}
                  placeholder="-Choose Repayment Plan-"
                  options={REPAYMENT_PLANS}
                  error={errors.repaymentPlan}
                />
              </Field>

              <Field
                label="Academy Session/Term"
                required
                error={errors.academicSession}
                hint="Select the academic year and the current term or semester"
              >
                <SelectWithChevron
                  value={state.step3.academicSession}
                  onChange={(v) => {
                    patch("step3", { ...state.step3, academicSession: v });
                    clearErr("academicSession");
                  }}
                  placeholder="-Select Academic Session/Term-"
                  options={SESSIONS}
                  error={errors.academicSession}
                />
              </Field>
            </div>

            {(state.step3.schoolId || state.step3.gradeLevel) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-semibold text-[#8B1C53] mb-3">
                  Your Selection Summary
                </p>
                <div className="flex flex-col">
                  {state.step3.institutionType && (
                    <Row
                      label="Institution"
                      value={state.step3.institutionType}
                    />
                  )}
                  {state.step3.schoolName && (
                    <Row label="School" value={state.step3.schoolName} />
                  )}
                  {state.step3.gradeLevel && (
                    <Row label="Level" value={state.step3.gradeLevel} />
                  )}
                  {state.step3.academicSession && (
                    <Row label="Session" value={state.step3.academicSession} />
                  )}
                  {state.step3.tuitionAmount && (
                    <Row
                      label="Tuition Fee"
                      value={`₦${Number(state.step3.tuitionAmount).toLocaleString()}`}
                    />
                  )}
                  {state.step3.repaymentPlan && (
                    <Row label="Plan" value={state.step3.repaymentPlan} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {state.step === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Student Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Provide accurate student details. You can add multiple students.
              </p>
            </div>

            {state.step4.students.map((st, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4"
              >
                {state.step4.students.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Student {i + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeStudent(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <TrashIcon /> Delete
                    </button>
                  </div>
                )}
                <Field
                  label="Full Name"
                  required
                  error={errors[`st_${i}_name`]}
                  hint="Enter the student's full legal name as registered with the school."
                >
                  <input
                    value={st.fullName}
                    placeholder="E.g. Adeola James"
                    onChange={(e) =>
                      updateStudent(i, "fullName", e.target.value)
                    }
                    className={inputCls(errors[`st_${i}_name`])}
                  />
                </Field>
                <Field
                  label="Date of Birth"
                  required
                  error={errors[`st_${i}_dob`]}
                >
                  <input
                    type="date"
                    value={st.dob}
                    onChange={(e) => updateStudent(i, "dob", e.target.value)}
                    className={inputCls(errors[`st_${i}_dob`])}
                  />
                </Field>
                <Field label="Gender" required error={errors[`st_${i}_gender`]}>
                  <SelectWithChevron
                    value={st.gender}
                    onChange={(v) => updateStudent(i, "gender", v)}
                    placeholder="– Select Gender –"
                    options={["Male", "Female"]}
                    error={errors[`st_${i}_gender`]}
                  />
                </Field>
                <Field
                  label="Admission Number / Student ID"
                  required
                  error={errors[`st_${i}_admission`]}
                >
                  <input
                    value={st.admissionNumber}
                    placeholder="E.g. SCH/2025/045"
                    onChange={(e) =>
                      updateStudent(i, "admissionNumber", e.target.value)
                    }
                    className={inputCls(errors[`st_${i}_admission`])}
                  />
                </Field>
              </div>
            ))}

            <button
              type="button"
              onClick={addStudent}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#8B1C53] hover:underline w-fit"
            >
              <PlusCircleIcon /> Add Another Student
            </button>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                Application Summary
              </p>
              <div className="flex flex-col">
                <Row
                  label="Parent/Guardian"
                  value={state.step1.fullName || "—"}
                />
                <Row
                  label="Student Name"
                  value={state.step4.students[0]?.fullName || "—"}
                />
                <Row
                  label="School / Institution"
                  value={state.step3.schoolName || "—"}
                />
                <Row
                  label="Institution Type"
                  value={state.step3.institutionType || "—"}
                />
                <Row
                  label="Amount Requested"
                  value={
                    state.step3.tuitionAmount
                      ? `₦${Number(state.step3.tuitionAmount).toLocaleString()}`
                      : "—"
                  }
                />
                <Row
                  label="Payment Plan"
                  value={state.step3.repaymentPlan || "—"}
                />
                <Row
                  label="Term / Session"
                  value={state.step3.academicSession || "—"}
                />
                <Row
                  label="Bank Verification"
                  value={
                    state.step2.bvnOrNin === "bvn"
                      ? "BVN Provided"
                      : "NIN Provided"
                  }
                />
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 rounded-full px-2 py-0.5">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>
            <label
              className={`flex items-start gap-2.5 cursor-pointer ${errors.terms ? "text-red-500" : "text-gray-600"}`}
            >
              <input
                type="checkbox"
                checked={state.step4.termsConfirmed}
                onChange={(e) => {
                  patch("step4", {
                    ...state.step4,
                    termsConfirmed: e.target.checked,
                  });
                  clearErr("terms");
                }}
                className="mt-0.5 h-4 w-4 accent-[#8B1C53]"
              />
              <span className="text-xs leading-relaxed">
                I confirm that all the information provided is accurate and
                agree to SkulCredit's Terms of Service.
              </span>
            </label>
            {errors.terms && (
              <p role="alert" className="text-xs text-red-500 -mt-2">
                {errors.terms}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          {state.step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={state.isSubmitting || state.isScoreChecking}
              className="flex items-center gap-1.5 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <BackIcon /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={state.isSubmitting || state.isScoreChecking}
            className="rounded-full bg-[#8B1C53] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60 min-w-[100px]"
          >
            {state.isScoreChecking
              ? "Checking score…"
              : state.isSubmitting
                ? state.step1.photoUploading
                  ? "Uploading photo…"
                  : "Please wait…"
                : state.step === 3
                  ? "Submit Application"
                  : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

void tenorFromPlan;

export default EligibilityTestPage;
