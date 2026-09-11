import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import { parentService } from "../../services/parentService";


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

const UploadIcon: React.FC = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
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
  "2024/2025 – 1st Term",
  "2024/2025 – 2nd Term",
  "2024/2025 – 3rd Term",
  "2025/2026 – 1st Semester",
  "2025/2026 – 2nd Semester",
];

const tenorFromPlan = (plan: string): number => {
  if (plan.startsWith("3")) return 3;
  if (plan.startsWith("6")) return 6;
  if (plan.startsWith("12")) return 12;
  return 6;
};


interface Step1Data {
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
  employerType: string;
  yearsInRole: string;
  monthlyIncome: string;
  homeAddress: string;
}

interface Step2Data {
  bvnOrNin: "bvn" | "nin";
  bvn: string;
  nin: string;
  bankStatementFile: File | null;
  employmentLetterFile: File | null;
  utilityBillFile: File | null;
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


const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, error, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-[#87144B]">
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
  `w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors border
   placeholder-[#87144B]/40 focus:ring-2 focus:ring-[#87144B]/20 focus:border-[#87144B]
   ${
     error
       ? "border-red-400 bg-red-50 text-red-700"
       : "border-[#87144B]/40 bg-white text-[#87144B] hover:border-[#87144B]/60"
   }`;

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2">
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
                    ? "border-[#540C2F] bg-white text-[#540C2F]"
                    : "border-transparent bg-[#F3E8F0] text-gray-800",
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

const FileUploadRow: React.FC<{
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  accept?: string;
}> = ({ label, file, onChange, error, accept = ".pdf,.jpg,.jpeg,.png" }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[#87144B]">{label}</span>
      <div
        className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        }`}
      >
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex shrink-0 items-center gap-1.5 rounded bg-[#8B1C53] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7a1848]"
        >
          <UploadIcon />
          {file ? "Change" : "Upload PDF"}
        </button>
        <span className="truncate text-xs text-gray-400 flex-1">
          {file ? file.name : "No file chosen"}
        </span>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-500"
          >
            <TrashIcon />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const EligibilityTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, dismissToast } = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<WizardState>({
    step: 0,
    step1: {
      fullName:
        user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      email: user?.email ?? "",
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
      bankStatementFile: null,
      employmentLetterFile: null,
      utilityBillFile: null,
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

  const loadSchools = useCallback(async (q = "") => {
    setLoadingSchools(true);
    try {
      const res = await apiClient.get<{ data: { schools?: School[] } }>(
        `/parents/schools?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`,
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
    if (state.step === 2) loadSchools(schoolSearch);
  }, [state.step, schoolSearch, loadSchools]);

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
    if (!s.bankStatementFile)
      e.bankStatementFile = "Bank statement is required.";
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
    if (
      !s.tuitionAmount ||
      isNaN(Number(s.tuitionAmount)) ||
      Number(s.tuitionAmount) <= 0
    )
      e.tuitionAmount = "Enter a valid tuition amount.";
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
      // if (state.step2.bankStatementFile) {
      //   const fd = new FormData();
      //   fd.append("file", state.step2.bankStatementFile);
      //   await apiClient.post("/upload/document", fd, {
      //     headers: { "Content-Type": "multipart/form-data" },
      //   });
      // }
      // await parentService.verifyKYC(
      //   state.step2.bvnOrNin === "bvn"
      //     ? { bvn: state.step2.bvn.trim() }
      //     : { bvn: state.step2.nin.trim(), nin: state.step2.nin.trim() },
      // );
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
      // const firstStudent = state.step4.students[0];
      // const [firstName, ...lastParts] = (
      //   firstStudent?.fullName || "Student Student"
      // ).split(" ");
      // const res = await apiClient.post<{ data: { id: string } }>(
      //   "/parents/students",
      //   {
      //     schoolId: state.step3.schoolId,
      //     firstName: firstName || "Student",
      //     lastName: lastParts.join(" ") || "Student",
      //     gradeLevel: state.step3.gradeLevel,
      //     tuitionAmount: Number(state.step3.tuitionAmount),
      //   },
      // );
      // patch("submittedStudentId", res.data.data.id);
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
      // const res = await apiClient.post<{ data: { referenceNumber?: string } }>(
      //   "/loans/apply",
      //   {
      //     studentId: state.submittedStudentId,
      //     amount: Number(state.step3.tuitionAmount),
      //     tenor: tenorFromPlan(state.step3.repaymentPlan),
      //   },
      // );
      // patch("applicationRef", res.data.data.referenceNumber ?? null);
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
            <p className="text-sm font-bold text-center mb-5 text-blue-700">
              What Happens Next?
            </p>
            <ul className="flex flex-col gap-3 text-left">
              {NEXT_STEPS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-blue-700"
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

      <div className="w-full max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white px-6 sm:px-10 py-8 mt-8 mb-12">
        <StepIndicator current={state.step} />

        {state.step === 0 && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#9B1858]">
                Parent Information / Guardian
              </h2>
              <p className="mt-1 text-xs text-[#87144B]">
                Ready to finance your child's school fees with flexibility?
                Let's start with your{" "}
                <span className="font-semibold">parent/guardian details.</span>
              </p>
            </div>

            <Field
              label="Full Name"
              hint="Auto-filled from signup and cannot be edited."
            >
              <input
                value={state.step1.fullName}
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </Field>

            <Field
              label="Email Address"
              hint="We'll use this email to send updates about your application."
            >
              <input
                value={state.step1.email}
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </Field>

            <Field
              label="Phone Number"
              required
              error={errors.phone}
              hint="Enter an active number we can reach you on."
            >
              <input
                value={state.step1.phone}
                placeholder="+234"
                onChange={(e) => {
                  patch("step1", { ...state.step1, phone: e.target.value });
                  clearErr("phone");
                }}
                className={inputCls(errors.phone)}
              />
            </Field>

            <Field
              label="Relationship to Student"
              required
              error={errors.relationship}
              hint="Choose if you're the parent, guardian, or sponsor."
            >
              <select
                value={state.step1.relationship}
                onChange={(e) => {
                  patch("step1", {
                    ...state.step1,
                    relationship: e.target.value,
                  });
                  clearErr("relationship");
                }}
                className={inputCls(errors.relationship)}
              >
                <option value="">– Select Relationship –</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Employer / Business Type"
              required
              error={errors.employerType}
            >
              <select
                value={state.step1.employerType}
                onChange={(e) => {
                  patch("step1", {
                    ...state.step1,
                    employerType: e.target.value,
                  });
                  clearErr("employerType");
                }}
                className={inputCls(errors.employerType)}
              >
                <option value="">– Select employment type –</option>
                {EMPLOYER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Years in Current Role"
              required
              error={errors.yearsInRole}
            >
              <select
                value={state.step1.yearsInRole}
                onChange={(e) => {
                  patch("step1", {
                    ...state.step1,
                    yearsInRole: e.target.value,
                  });
                  clearErr("yearsInRole");
                }}
                className={inputCls(errors.yearsInRole)}
              >
                <option value="">– Select years of experience –</option>
                {YEARS_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Monthly Income (₦)"
              required
              error={errors.monthlyIncome}
            >
              <select
                value={state.step1.monthlyIncome}
                onChange={(e) => {
                  patch("step1", {
                    ...state.step1,
                    monthlyIncome: e.target.value,
                  });
                  clearErr("monthlyIncome");
                }}
                className={inputCls(errors.monthlyIncome)}
              >
                <option value="">– Select income range –</option>
                {INCOME_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Home Address"
              required
              error={errors.homeAddress}
              hint="Enter your full residential address for verification."
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
        )}

        {/* ── STEP 2 — BVN/NIN & Credit Verification ── */}
        {state.step === 1 && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Identity &amp; Document Verification
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Verify your identity and upload required documents
              </p>
            </div>

            {/* BVN / NIN card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#87144B]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#87144B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#87144B]">
                  Identity Verification
                </p>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Verify your identity using BVN or NIN for faster processing
              </p>

              {/* Segmented toggle */}
              <div className="flex rounded-full p-2 bg-[#FBF4FD]">
                {(["bvn", "nin"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      patch("step2", { ...state.step2, bvnOrNin: tab })
                    }
                    className="flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-200"
                    style={
                      state.step2.bvnOrNin === tab
                        ? {
                            backgroundColor: "#87144B",
                            color: "#fff",
                            boxShadow: "0 1px 4px rgba(84,12,47,0.25)",
                          }
                        : { backgroundColor: "transparent", color: "#888" }
                    }
                  >
                    {tab.toUpperCase()} Verification
                  </button>
                ))}
              </div>

              {state.step2.bvnOrNin === "bvn" ? (
                <Field
                  label="Bank Verification Number (BVN)"
                  required
                  error={errors.bvn}
                  hint="11-digit number linked to your bank account."
                >
                  <div className="flex gap-2">
                    <input
                      value={state.step2.bvn}
                      maxLength={11}
                      inputMode="numeric"
                      placeholder="Enter your 11-digit BVN"
                      onChange={(e) => {
                        patch("step2", {
                          ...state.step2,
                          bvn: e.target.value.replace(/\D/g, ""),
                        });
                        clearErr("bvn");
                      }}
                      className={inputCls(errors.bvn) + " flex-1"}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-md px-4 py-2 text-xs font-semibold text-white bg-[#87144B] hover:bg-[#7a1848] transition-colors"
                    >
                      Verify BVN
                    </button>
                  </div>
                </Field>
              ) : (
                <Field
                  label="National Identification Number (NIN)"
                  required
                  error={errors.nin}
                  hint="11-digit NIN from your NIMC slip."
                >
                  <div className="flex gap-2">
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
                      className={inputCls(errors.nin) + " flex-1"}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-md px-4 py-2 text-xs font-semibold text-white bg-[#87144B] hover:bg-[#7a1848] transition-colors"
                    >
                      Verify NIN
                    </button>
                  </div>
                </Field>
              )}
            </div>

            {/* Document uploads */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-700">
                Upload Documents
              </p>
              <FileUploadRow
                label="Bank Statement (Last 3 months) *"
                file={state.step2.bankStatementFile}
                error={errors.bankStatementFile}
                onChange={(f) => {
                  patch("step2", { ...state.step2, bankStatementFile: f });
                  clearErr("bankStatementFile");
                }}
              />
              <p className="text-xs text-gray-400 -mt-2">
                PDF, JPG, or PNG format
              </p>
              <FileUploadRow
                label="Employment Letter / Business Registration"
                file={state.step2.employmentLetterFile}
                onChange={(f) =>
                  patch("step2", { ...state.step2, employmentLetterFile: f })
                }
              />
              <FileUploadRow
                label="Utility Bill (Proof of Address)"
                file={state.step2.utilityBillFile}
                onChange={(f) =>
                  patch("step2", { ...state.step2, utilityBillFile: f })
                }
              />
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-xs text-green-700">
              <span className="font-semibold">Almost done!</span> Review your
              information on the next page before submitting.
            </div>
          </div>
        )}

        {/* ── STEP 3 — Select School & Tuition Plan ── */}
        {state.step === 2 && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <div>
              <h2 className="text-base font-bold text-[#8B1C53]">
                Choose School &amp; School Fee Plan
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Select your child's school and choose a tuition plan. Your
                application will be linked directly to the school for payment.
              </p>
            </div>

            <Field
              label="Institution Type"
              required
              error={errors.institutionType}
              hint="Choose whether your child attends primary, secondary, or tertiary."
            >
              <select
                value={state.step3.institutionType}
                onChange={(e) => {
                  patch("step3", {
                    ...state.step3,
                    institutionType: e.target.value,
                  });
                  clearErr("institutionType");
                }}
                className={inputCls(errors.institutionType)}
              >
                <option value="">– Select Institution level –</option>
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Choose Student School"
              required
              error={errors.schoolId}
              hint="Only schools partnered with SkulCredit appear here."
            >
              <div className="flex flex-col gap-1.5">
                <input
                  value={schoolSearch}
                  placeholder="Type to search school name…"
                  className={inputCls(errors.schoolId)}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    if (state.step3.schoolId)
                      patch("step3", {
                        ...state.step3,
                        schoolId: "",
                        schoolName: "",
                      });
                    clearErr("schoolId");
                  }}
                />

                {loadingSchools && (
                  <p className="text-xs text-gray-400">Loading schools…</p>
                )}

                {!loadingSchools &&
                  schools.length > 0 &&
                  !state.step3.schoolId &&
                  schoolSearch.length > 0 && (
                    <div className="rounded-md border border-gray-200 bg-white shadow-sm max-h-48 overflow-y-auto z-10">
                      {schools
                        .filter((s) =>
                          s.schoolName
                            .toLowerCase()
                            .includes(schoolSearch.toLowerCase()),
                        )
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full px-3 py-2.5 text-left text-sm hover:bg-[#8B1C53]/5 transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                              patch("step3", {
                                ...state.step3,
                                schoolId: s.id,
                                schoolName: s.schoolName,
                              });
                              setSchoolSearch(s.schoolName);
                              clearErr("schoolId");
                            }}
                          >
                            {s.schoolName}
                            <span className="ml-1.5 text-xs text-gray-400">
                              {s.addressCity}, {s.addressState}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}

                {state.step3.schoolId && (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs font-medium text-green-700 flex-1">
                      {state.step3.schoolName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        patch("step3", {
                          ...state.step3,
                          schoolId: "",
                          schoolName: "",
                        });
                        setSchoolSearch("");
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!loadingSchools &&
                  schools.length === 0 &&
                  schoolSearch.trim() &&
                  !state.step3.schoolId && (
                    <button
                      type="button"
                      className="w-full text-left rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-[#8B1C53]/50 hover:text-[#8B1C53] transition-colors"
                      onClick={() => {
                        patch("step3", {
                          ...state.step3,
                          schoolId: `manual-${Date.now()}`,
                          schoolName: schoolSearch.trim(),
                        });
                        clearErr("schoolId");
                      }}
                    >
                      + Use "
                      <span className="font-medium">{schoolSearch.trim()}</span>
                      " as school name
                    </button>
                  )}
              </div>
            </Field>

            <Field label="Class / Level" required error={errors.gradeLevel}>
              <input
                value={state.step3.gradeLevel}
                placeholder="e.g. JSS 2, Grade 5, 200L"
                onChange={(e) => {
                  patch("step3", {
                    ...state.step3,
                    gradeLevel: e.target.value,
                  });
                  clearErr("gradeLevel");
                }}
                className={inputCls(errors.gradeLevel)}
              />
            </Field>

            <Field
              label="Tuition Amount (₦)"
              required
              error={errors.tuitionAmount}
            >
              <input
                value={state.step3.tuitionAmount}
                inputMode="numeric"
                placeholder="e.g. 250000"
                onChange={(e) => {
                  patch("step3", {
                    ...state.step3,
                    tuitionAmount: e.target.value.replace(/[^0-9.]/g, ""),
                  });
                  clearErr("tuitionAmount");
                }}
                className={inputCls(errors.tuitionAmount)}
              />
            </Field>

            <Field
              label="Choose Repayment Plan"
              required
              error={errors.repaymentPlan}
              hint="Select a flexible repayment option."
            >
              <select
                value={state.step3.repaymentPlan}
                onChange={(e) => {
                  patch("step3", {
                    ...state.step3,
                    repaymentPlan: e.target.value,
                  });
                  clearErr("repaymentPlan");
                }}
                className={inputCls(errors.repaymentPlan)}
              >
                <option value="">– Choose Repayment Plan –</option>
                {REPAYMENT_PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Academic Session / Term"
              required
              error={errors.academicSession}
            >
              <select
                value={state.step3.academicSession}
                onChange={(e) => {
                  patch("step3", {
                    ...state.step3,
                    academicSession: e.target.value,
                  });
                  clearErr("academicSession");
                }}
                className={inputCls(errors.academicSession)}
              >
                <option value="">– Select Academic Session / Term –</option>
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            {(state.step3.schoolId || state.step3.tuitionAmount) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Your Selection Summary
                </p>
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
              <p className="mt-1 text-xs text-gray-500">
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
                  <select
                    value={st.gender}
                    onChange={(e) => updateStudent(i, "gender", e.target.value)}
                    className={inputCls(errors[`st_${i}_gender`])}
                  >
                    <option value="">– Select Gender –</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
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
              <div className="flex flex-col divide-y divide-gray-100">
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
              className="flex items-center gap-1.5 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
                : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityTestPage;
