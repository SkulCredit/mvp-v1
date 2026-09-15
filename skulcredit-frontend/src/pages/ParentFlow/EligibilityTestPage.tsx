import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import { parentService } from "../../services/parentService";

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── Icons ─────────────────────────────────────────────────────────────────────

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

const UploadCloudIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10 text-gray-400"
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

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Parent/Guardian\nInformation", short: "Parent Info" },
  { label: "BVN/NIN &\nCredit Verification", short: "KYC" },
  { label: "Select School &\nTuition Plan", short: "School" },
  { label: "Student\nInformation", short: "Students" },
] as const;

type Step = 0 | 1 | 2 | 3;

const COUNTRY_CODES = [
  { code: "+234", flag: "🇳🇬", label: "NG" },
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+44", flag: "🇬🇧", label: "GB" },
  { code: "+233", flag: "🇬🇭", label: "GH" },
];

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
const INSTITUTION_TYPES = [
  "Nursery",
  "Primary",
  "Secondary",
  "Tertiary",
  "Vocational",
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
const GRADE_LEVELS: Record<string, string[]> = {
  Nursery: ["Creche", "Nursery 1", "Nursery 2", "Nursery 3"],
  Primary: [
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
  ],
  Secondary: ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"],
  Tertiary: ["100L", "200L", "300L", "400L", "500L", "6th Year"],
  Vocational: ["Year 1", "Year 2", "Year 3"],
};
const DOCUMENT_TYPES = [
  "Bank Statement (Last 3 Months)",
  "Employment Letter",
  "Business Registration",
  "Utility Bill",
  "Government-Issued ID",
  "Tax Clearance Certificate",
];

const tenorFromPlan = (plan: string): number => {
  if (plan.startsWith("3")) return 3;
  if (plan.startsWith("6")) return 6;
  if (plan.startsWith("12")) return 12;
  return 6;
};

// ── Data types ────────────────────────────────────────────────────────────────

interface Step1Data {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  relationship: string;
  employerType: string;
  yearsInRole: string;
  monthlyIncome: string;
  homeAddress: string;
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
  ninStatus: "idle" | "error" | "verified";
  selectedDocType: string;
  pendingFile: File | null;
  uploadedDocs: UploadedDoc[];
}

interface Step3Data {
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
  submittedStudentId: string | null;
  applicationRef: string | null;
  isSubmitting: boolean;
  showSuccess: boolean;
}

interface School {
  id: string;
  schoolName: string;
  addressCity: string;
  addressState: string;
}

// ── Shared small components ───────────────────────────────────────────────────

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
   ${
     error
       ? "border-red-400 bg-red-50 text-red-700"
       : "border-gray-200 text-gray-800 hover:border-gray-300"
   }`;

const selectCls = (error?: string) =>
  `w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors border bg-white appearance-none
   focus:ring-2 focus:ring-[#8B1C53]/20 focus:border-[#8B1C53] cursor-pointer
   ${
     error
       ? "border-red-400 bg-red-50 text-red-700"
       : "border-gray-200 text-gray-800 hover:border-gray-300"
   }`;

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}:</span>
    <span className="text-sm font-medium text-gray-800 text-right ml-4">
      {value}
    </span>
  </div>
);

// ── StepIndicator ─────────────────────────────────────────────────────────────

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

// ── SelectWithChevron ─────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

const EligibilityTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, dismissToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<WizardState>({
    step: 0,
    step1: {
      fullName:
        user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      email: user?.email ?? "",
      phoneCountryCode: "+234",
      phone: user?.phoneNumber ?? "",
      relationship: "",
      employerType: "",
      yearsInRole: "",
      monthlyIncome: "",
      homeAddress: "",
    },
    step2: {
      bvnOrNin: "bvn",
      bvn: "",
      nin: "",
      bvnStatus: "idle",
      ninStatus: "idle",
      selectedDocType: "",
      pendingFile: null,
      uploadedDocs: [],
    },
    step3: {
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
    submittedStudentId: null,
    applicationRef: null,
    isSubmitting: false,
    showSuccess: false,
  });

  const patch = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const clearErr = (key: string) =>
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });

  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const res = await apiClient.get<{ data: { schools?: School[] } }>(
        `/parents/schools?limit=100`,
      );
      const arr = Array.isArray(res.data.data)
        ? (res.data.data as School[])
        : (res.data.data?.schools ?? []);
      setSchools(arr);
    } catch {
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  useEffect(() => {
    if (state.step === 2) loadSchools();
  }, [state.step, loadSchools]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    const s = state.step1;
    if (!s.phone.trim()) e.phone = "Phone number is required.";
    if (!s.relationship)
      e.relationship = "Please select your relationship to the student.";
    if (!s.employerType) e.employerType = "Please select your employment type.";
    if (!s.yearsInRole) e.yearsInRole = "Please select years in current role.";
    if (!s.monthlyIncome) e.monthlyIncome = "Please select your income range.";
    if (!s.homeAddress.trim()) e.homeAddress = "Home address is required.";
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
    }
    if (s.uploadedDocs.length === 0)
      e.uploadedDocs = "Please upload at least one document.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    const s = state.step3;
    if (!s.institutionType) e.institutionType = "Institution type is required.";
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

  // ── Submit handlers ───────────────────────────────────────────────────────

  const submitStep1 = async (): Promise<boolean> => {
    if (!validateStep1()) return false;
    try {
      const [street, ...rest] = state.step1.homeAddress.split(",");
      await apiClient.put("/parents/profile", {
        addressStreet: street?.trim() || state.step1.homeAddress,
        addressCity: rest[0]?.trim() || undefined,
        addressState: rest[1]?.trim() || undefined,
      });
      return true;
    } catch (err) {
      showToast(
        (err as { message?: string }).message ?? "Profile update failed.",
      );
      return false;
    }
  };

  const submitStep2 = async (): Promise<boolean> => {
    if (!validateStep2()) return false;
    patch("isSubmitting", true);
    try {
      return true;
    } catch (err) {
      showToast(
        (err as { message?: string }).message ??
          "Identity verification failed.",
      );
      return false;
    } finally {
      patch("isSubmitting", false);
    }
  };

  const submitStep3 = async (): Promise<boolean> => {
    if (!validateStep3()) return false;
    patch("isSubmitting", true);
    try {
      return true;
    } catch (err) {
      showToast(
        (err as { message?: string }).message ?? "Failed to save student info.",
      );
      return false;
    } finally {
      patch("isSubmitting", false);
    }
  };

  const submitStep4 = async (): Promise<void> => {
    if (!validateStep4()) return;
    if (!state.submittedStudentId) {
      showToast("Student record missing. Please go back to Step 3.");
      return;
    }
    patch("isSubmitting", true);
    try {
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

  // Step 2 – document upload helpers
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
    // Reset file input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDoc = (id: string) => {
    patch("step2", {
      ...state.step2,
      uploadedDocs: state.step2.uploadedDocs.filter((d) => d.id !== id),
    });
  };

  // ── Success screen ────────────────────────────────────────────────────────

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

  // ── Wizard render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full animate-fade-in-up">
      <Toast
        message={toast.message}
        visible={toast.visible}
        onDismiss={dismissToast}
      />

      <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white px-6 sm:px-10 py-8 mt-8 mb-12">
        <StepIndicator current={state.step} />

        {/* ── STEP 1 — Parent/Guardian Information ── */}
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

            {/* Personal details card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              {/* Full Name */}
              <Field
                label="Full Name"
                hint="This is auto-filled from signup and cannot be edited"
              >
                <input
                  value={state.step1.fullName}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </Field>

              {/* Email */}
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

              {/* Phone Number with country code selector */}
              <Field
                label="Phone Number"
                required
                error={errors.phone}
                hint="Enter your country code"
              >
                <div
                  className={`flex rounded-lg border overflow-hidden transition-colors ${errors.phone ? "border-red-400" : "border-gray-200 focus-within:border-[#8B1C53]"}`}
                >
                  <div className="relative shrink-0">
                    <select
                      value={state.step1.phoneCountryCode}
                      onChange={(e) =>
                        patch("step1", {
                          ...state.step1,
                          phoneCountryCode: e.target.value,
                        })
                      }
                      className="h-full appearance-none bg-gray-50 border-r border-gray-200 pl-3 pr-7 py-2.5 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                      aria-label="Country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
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
                      className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <input
                    value={state.step1.phone}
                    placeholder="Enter your phone number"
                    inputMode="tel"
                    onChange={(e) => {
                      patch("step1", { ...state.step1, phone: e.target.value });
                      clearErr("phone");
                    }}
                    className="flex-1 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none"
                  />
                </div>
              </Field>

              {/* Relationship to Student */}
              <Field
                label="Relationship to Student"
                required
                error={errors.relationship}
                hint="Choose if you're the parent, guardian, student"
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

            {/* Employment details card */}
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
                hint="Enter your full residential address for verification purposes."
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

              {/* Home Address */}
              <Field
                label="Home Address"
                required
                error={errors.homeAddress}
                hint="Enter your full residential address for verification purposes."
              >
                <input
                  value={state.step1.homeAddress}
                  placeholder="Enter your address"
                  onChange={(e) => {
                    patch("step1", {
                      ...state.step1,
                      homeAddress: e.target.value,
                    });
                    clearErr("homeAddress");
                  }}
                  className={inputCls(errors.homeAddress)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 2 — BVN/NIN & Credit Verification ── */}
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

            {/* Identity Verification card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              {/* Card header */}
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

              {/* BVN / NIN tab toggle */}
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

              {/* BVN input */}
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
                      <>
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
                        <button
                          type="button"
                          onClick={() => {
                            if (!/^\d{11}$/.test(state.step2.bvn)) {
                              setErrors((p) => ({
                                ...p,
                                bvn: "BVN must be exactly 11 digits.",
                              }));
                            }
                            // In production: call verify API here, set bvnStatus accordingly
                          }}
                          className="shrink-0 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-[#8B1C53] border-l border-gray-200 bg-gray-50 transition-colors"
                        >
                          Verify
                        </button>
                      </>
                    )}
                  </div>
                  {state.step2.bvnStatus === "error" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Visit your nearest BVN enrollment center or check your NIN
                      slip
                    </p>
                  )}
                </Field>
              )}

              {/* NIN input */}
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
                      onChange={(e) => {
                        patch("step2", {
                          ...state.step2,
                          nin: e.target.value.replace(/\D/g, ""),
                        });
                        clearErr("nin");
                      }}
                      className="flex-1 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      className="shrink-0 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-[#8B1C53] border-l border-gray-200 bg-gray-50 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    11-digit NIN from your NIMC slip or National ID card
                  </p>
                </Field>
              )}
            </div>

            {/* Upload documents card */}
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

              {/* Document type dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Document type
                </label>
                <SelectWithChevron
                  value={state.step2.selectedDocType}
                  onChange={(v) =>
                    patch("step2", { ...state.step2, selectedDocType: v })
                  }
                  placeholder="Select document type"
                  options={DOCUMENT_TYPES}
                />
              </div>

              {/* Drop zone */}
              <div
                className={`rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-10 cursor-pointer ${
                  state.step2.selectedDocType
                    ? "border-gray-300 hover:border-[#8B1C53]/50 bg-white"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
                onClick={() =>
                  state.step2.selectedDocType && fileInputRef.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && state.step2.selectedDocType)
                    handleFileSelect(file);
                }}
                role="button"
                aria-label="Upload document"
                tabIndex={state.step2.selectedDocType ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    state.step2.selectedDocType &&
                      fileInputRef.current?.click();
                  }
                }}
              >
                <UploadCloudIcon />
                <p
                  className={`text-sm font-medium ${state.step2.selectedDocType ? "text-gray-600" : "text-gray-400"}`}
                >
                  {state.step2.selectedDocType
                    ? "Select a document type to enable upload"
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
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 rounded-full bg-[#8B1C53] px-6 py-2 text-sm font-semibold text-white hover:bg-[#7a1848] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Browser
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              {errors.uploadedDocs && (
                <p role="alert" className="text-xs text-red-500">
                  {errors.uploadedDocs}
                </p>
              )}
            </div>

            {/* Uploaded documents table */}
            {state.step2.uploadedDocs.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-800">
                  Uploaded documents
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_100px_80px] bg-[#FBF4FD] px-4 py-2.5 text-xs font-semibold text-[#8B1C53]">
                    <span>Document</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {/* Table rows */}
                  {state.step2.uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-[1fr_100px_80px] items-center px-4 py-3 border-t border-gray-100"
                    >
                      {/* Document name + size */}
                      <div className="flex items-center gap-2 min-w-0">
                        <PaperclipIcon />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-400">{doc.size}</p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="flex justify-center">
                        {doc.status === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-600">
                            <CheckIcon className="w-3 h-3" />
                            Verified
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
                      {/* Actions */}
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

        {/* ── STEP 3 — Select School & Tuition Plan ── */}
        {state.step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Choose School &amp; School fee Plan
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select your child's school and choose a tuition plan that fits
                your needs. Your application will be linked directly to the
                school for payment.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
              {/* Institution Type */}
              <Field
                label="Institution Type"
                required
                error={errors.institutionType}
                hint="Choose whether your child attends a primary, secondary, or tertiary institution."
              >
                <SelectWithChevron
                  value={state.step3.institutionType}
                  onChange={(v) => {
                    patch("step3", {
                      ...state.step3,
                      institutionType: v,
                      gradeLevel: "",
                      schoolId: "",
                      schoolName: "",
                    });
                    clearErr("institutionType");
                  }}
                  placeholder="-Select institution level-"
                  options={INSTITUTION_TYPES}
                  error={errors.institutionType}
                />
              </Field>

              {/* Choose Student School */}
              <Field
                label="Choose Student School"
                required
                error={errors.schoolId}
                hint="Only schools partnered with Skulcredit will appear here."
              >
                <div className="relative">
                  <select
                    value={state.step3.schoolId}
                    onChange={(e) => {
                      const selected = schools.find(
                        (s) => s.id === e.target.value,
                      );
                      patch("step3", {
                        ...state.step3,
                        schoolId: e.target.value,
                        schoolName: selected?.schoolName ?? "",
                      });
                      clearErr("schoolId");
                    }}
                    disabled={loadingSchools}
                    className={
                      selectCls(errors.schoolId) +
                      (loadingSchools ? " opacity-60 cursor-wait" : "")
                    }
                  >
                    <option value="">
                      {loadingSchools ? "Loading schools…" : "-Choose School-"}
                    </option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schoolName}
                        {s.addressCity ? ` – ${s.addressCity}` : ""}
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

              {/* Class / Level */}
              <Field
                label="Class/Level"
                required
                error={errors.gradeLevel}
                hint="Choose student class or level"
              >
                <SelectWithChevron
                  value={state.step3.gradeLevel}
                  onChange={(v) => {
                    patch("step3", { ...state.step3, gradeLevel: v });
                    clearErr("gradeLevel");
                  }}
                  placeholder="-Choose Student Class/Level-"
                  options={
                    state.step3.institutionType
                      ? (GRADE_LEVELS[state.step3.institutionType] ?? [])
                      : []
                  }
                  error={errors.gradeLevel}
                  disabled={!state.step3.institutionType}
                />
              </Field>

              {/* Choose Repayment Plan */}
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

              {/* Academic Session / Term */}
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

            {/* Selection Summary */}
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
                      value={`#${Number(state.step3.tuitionAmount).toLocaleString()}`}
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

        {/* ── STEP 4 — Student Information + Review ── */}
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

            {/* Application Summary */}
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

            {/* Terms */}
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

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          {state.step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={state.isSubmitting}
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
            disabled={state.isSubmitting}
            className="rounded-full bg-[#8B1C53] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60 min-w-[100px]"
          >
            {state.isSubmitting
              ? "Please wait…"
              : state.step === 3
                ? "Submit Application"
                : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityTestPage;
