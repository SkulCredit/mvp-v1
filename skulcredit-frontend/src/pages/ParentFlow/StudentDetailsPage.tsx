import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  parentService,
  catalogService,
  CatalogInstitutionType,
  CatalogSchool,
  CatalogClassLevelGroup,
  AcademicSessionSummary,
  AcademicTermSummary,
} from "../../services/parentService";
import apiClient from "../../services/apiClient";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  schoolName?: string;
  schoolId?: string;
  photo?: string;
  tuitionAmount?: number;
}

interface School {
  id: string;
  schoolName: string;
  addressCity?: string;
  addressState?: string;
  logo?: string;
  levels?: string[];
}

interface RepaymentPlan {
  id: "3month" | "4month";
  label: string;
  sub: string;
  total: number;
  monthlyAmount?: number;
  serviceFeeRate: number;
}

interface TuitionDetails {
  institutionTypeId: string;
  institutionTypeName: string;
  schoolId: string;
  schoolName: string;
  gradeLevel: string;
  tuitionAmount: number;
  repaymentPlanId: "3month" | "4month";
  academicSession: string; 
  term: string; 
  termId: string; 
  isManualSchool?: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5;

const MOCK_CHILDREN: Child[] = [
  {
    id: "c1",
    firstName: "Amara",
    lastName: "Bello",
    gradeLevel: "Primary 5",
    schoolName: "Peershore Academy",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "c2",
    firstName: "Chidi",
    lastName: "Oke",
    gradeLevel: "Primary 5",
    schoolName: "Peershore Academy",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
];

const MOCK_SCHOOLS: School[] = [
  {
    id: "s1",
    schoolName: "Peenshores Academy",
    addressCity: "Lagos",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s2",
    schoolName: "Peenshores Academy",
    addressCity: "Abuja",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s3",
    schoolName: "Peenshores Academy",
    addressCity: "Port Harcourt",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s4",
    schoolName: "Peenshores Academy",
    addressCity: "Ibadan",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s5",
    schoolName: "Greenfield College",
    addressCity: "Enugu",
    levels: ["Secondary"],
  },
  {
    id: "s6",
    schoolName: "Sunrise Montessori",
    addressCity: "Lagos",
    levels: ["Primary"],
  },
];

const ACADEMIC_SESSIONS = ["2024/2025", "2025/2026", "2026/2027"];
const TERMS = [
  "Term 1",
  "Term 2",
  "Term 3",
  "First Semester",
  "Second Semester",
];

const FALLBACK_TUITION_AMOUNT = 450_000;

const STEPS: { label: string; short: string }[] = [
  { label: "Select Child", short: "Child" },
  { label: "Select School", short: "School" },
  { label: "Tuition Details", short: "Tuition" },
  { label: "Review", short: "Review" },
  { label: "Submit", short: "Submit" },
];

const fmt = (n: number) =>
  "₦" +
  n.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function buildRepaymentPlans(tuitionAmount: number): RepaymentPlan[] {
  return [
    {
      id: "3month",
      label: "3-month plan",
      sub: `${fmt(Math.round(tuitionAmount / 3))}/mo · service charge paid upfront`,
      total: tuitionAmount,
      monthlyAmount: Math.round(tuitionAmount / 3),
      serviceFeeRate: 0.04,
    },
    {
      id: "4month",
      label: "4-month plan",
      sub: `${fmt(Math.round(tuitionAmount / 4))}/mo · service charge paid upfront`,
      total: tuitionAmount,
      monthlyAmount: Math.round(tuitionAmount / 4),
      serviceFeeRate: 0.055,
    },
  ];
}

function tenorFromPlanId(id: "3month" | "4month"): number {
  if (id === "4month") return 4;
  return 3;
}

const Stepper: React.FC<{ current: Step; completedChild?: Child | null }> = ({
  current,
  completedChild,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-6 py-4 flex items-center justify-between gap-1 overflow-hidden">
    {STEPS.map((s, i) => {
      const num = (i + 1) as Step;
      const done = num < current;
      const active = num === current;
      return (
        <React.Fragment key={num}>
          <div className="flex flex-col items-center gap-1 shrink-0 relative z-10 min-w-0">
            {done && num === 1 && completedChild && (
              <img
                src={
                  completedChild.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(completedChild.firstName)}&background=881337&color=fff&size=36`
                }
                alt={completedChild.firstName}
                className="absolute -top-4 w-8 h-8 rounded-full object-cover ring-2 ring-white shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(completedChild.firstName)}&background=881337&color=fff&size=36`;
                }}
              />
            )}
            <div
              className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 ${
                done
                  ? "bg-[#881337] text-white"
                  : active
                    ? "bg-[#881337] text-white ring-4 ring-[#881337]/20"
                    : "border-2 border-[#F2C4D0] text-[#D4879A] bg-white"
              }`}
            >
              {done ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                num
              )}
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-semibold text-center leading-tight w-full truncate ${
                active
                  ? "text-[#881337]"
                  : done
                    ? "text-gray-500"
                    : "text-[#D4879A]"
              }`}
            >
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px min-w-0 transition-colors mx-0.5 sm:mx-1 ${num < current ? "bg-[#881337]/40" : "bg-gray-200"}`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const NavBar: React.FC<{
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  loading?: boolean;
  hidden?: boolean;
}> = ({
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continue",
  loading = false,
  hidden = false,
}) => {
  if (hidden) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-t border-gray-100 px-4 sm:px-8 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 border-2 border-[#881337] text-[#881337] font-bold px-4 sm:px-5 py-2.5 rounded-full hover:bg-[#881337]/5 transition-colors text-sm whitespace-nowrap"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || loading}
          className={`inline-flex items-center gap-2 font-bold px-5 sm:px-6 py-2.5 rounded-full text-sm transition-all whitespace-nowrap ${
            continueDisabled || loading
              ? "bg-[#881337]/20 text-[#881337]/50 cursor-not-allowed"
              : "bg-[#881337] text-white hover:bg-[#4c0519] shadow-sm"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
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
              Submitting…
            </>
          ) : (
            <>
              {continueLabel}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const StepSelectChild: React.FC<{
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  blockedStudentIds?: Set<string>;
}> = ({
  children,
  selectedId,
  onSelect,
  onAddNew,
  blockedStudentIds = new Set(),
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
        Who are you applying for?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Select a child already on your account, or add a new child to continue
      </p>
    </div>

    {children.length > 0 && (
      <div className="mt-4">
        <p className="text-sm font-bold text-gray-700 mb-3">
          Existing Children
        </p>
        <div className="space-y-3">
          {children.map((child) => {
            const selected = selectedId === child.id;
            const blocked = blockedStudentIds.has(child.id);
            return (
              <div
                key={child.id}
                onClick={() => !blocked && onSelect(child.id)}
                className={`flex items-center gap-3 bg-white rounded-2xl border px-3 sm:px-5 py-3 sm:py-4 transition-all ${
                  blocked
                    ? "border-gray-100 opacity-60 cursor-not-allowed bg-gray-50"
                    : selected
                      ? "border-[#881337] ring-2 ring-[#881337]/20 cursor-pointer"
                      : "border-gray-200 hover:border-[#881337]/40 cursor-pointer"
                }`}
              >
                <img
                  src={
                    child.photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(child.firstName)}&background=881337&color=fff&size=44`
                  }
                  alt={child.firstName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(child.firstName)}&background=881337&color=fff&size=44`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {child.firstName} {child.lastName}
                  </p>
                  {child.schoolName && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="truncate">{child.schoolName}</span>
                    </p>
                  )}
                  {child.gradeLevel && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 shrink-0"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="3" y1="15" x2="21" y2="15" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                        <line x1="15" y1="3" x2="15" y2="21" />
                      </svg>
                      {child.gradeLevel}
                    </p>
                  )}
                </div>
                {/* Radio dot — hidden when blocked */}
                {blocked ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
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
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Applied this term
                  </span>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-[#881337]" : "border-gray-300"}`}
                  >
                    {selected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#881337]" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Add new child */}
    <button
      type="button"
      onClick={onAddNew}
      className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-200 hover:border-[#881337]/40 px-3 sm:px-5 py-3 sm:py-4 transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-full bg-[#881337]/10 flex items-center justify-center shrink-0 group-hover:bg-[#881337]/20 transition-colors">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-[#881337]"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">Add a new child</p>
        <p className="mt-0.5 text-xs text-gray-500 leading-snug">
          Add your child's details once. Reuse for future applications.
        </p>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-gray-300 group-hover:text-[#881337] transition-colors shrink-0"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
);

interface ManualSchoolData {
  schoolName: string;
  contact: string; 
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  location: string;
  gradeLevel: string;
}

const ChevronDown: React.FC = () => (
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
);

const selectCls = (hasError = false) =>
  `w-full rounded-xl border bg-white px-3 py-3 text-sm appearance-none outline-none transition-colors cursor-pointer pr-10 ${
    hasError
      ? "border-red-400 text-red-700"
      : "border-gray-200 text-gray-800 hover:border-gray-300 focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15"
  }`;

const StepSelectSchool: React.FC<{
  institutionTypes: CatalogInstitutionType[];
  catalogSchools: CatalogSchool[];
  classLevelGroups: CatalogClassLevelGroup[];
  loadingTypes: boolean;
  loadingSchools: boolean;
  loadingClasses: boolean;
  selectedInstitutionTypeId: string;
  selectedSchoolId: string;
  selectedGradeLevel: string;
  onInstitutionTypeChange: (id: string, name: string) => void;
  onSchoolChange: (id: string, name: string) => void;
  onGradeLevelChange: (level: string) => void;
  sessions: AcademicSessionSummary[];
  loadingSessions: boolean;
  selectedSessionName: string;
  selectedTermId: string;
  onSessionChange: (sessionName: string) => void;
  onTermChange: (termId: string, termName: string) => void;
  onManualSchoolSubmit: (data: ManualSchoolData) => void;
  manualSchoolPending: boolean;
}> = ({
  institutionTypes,
  catalogSchools,
  classLevelGroups,
  loadingTypes,
  loadingSchools,
  loadingClasses,
  selectedInstitutionTypeId,
  selectedSchoolId,
  selectedGradeLevel,
  onInstitutionTypeChange,
  onSchoolChange,
  onGradeLevelChange,
  sessions,
  loadingSessions,
  selectedSessionName,
  selectedTermId,
  onSessionChange,
  onTermChange,
  onManualSchoolSubmit,
  manualSchoolPending,
}) => {
  const flatClasses = classLevelGroups.flatMap((g) => g.classes);
  const activeSession = sessions.find(
    (s) => s.sessionName === selectedSessionName,
  );
  const availableTerms: AcademicTermSummary[] = activeSession?.terms ?? [];

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualContact, setManualContact] = useState("");
  const [manualBankName, setManualBankName] = useState("");
  const [manualAccountNumber, setManualAccountNumber] = useState("");
  const [manualAccountName, setManualAccountName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualGrade, setManualGrade] = useState("");
  const [manualFormError, setManualFormError] = useState("");

  const handleManualSubmit = () => {
    setManualFormError("");
    if (!manualName.trim()) {
      setManualFormError("School name is required.");
      return;
    }
    if (!manualContact.trim()) {
      setManualFormError("School contact (email or phone) is required.");
      return;
    }
    if (!manualLocation.trim()) {
      setManualFormError("School location is required.");
      return;
    }
    if (!manualGrade.trim()) {
      setManualFormError("Class / level is required.");
      return;
    }
    onManualSchoolSubmit({
      schoolName: manualName.trim(),
      contact: manualContact.trim(),
      bankName: manualBankName.trim() || undefined,
      accountNumber: manualAccountNumber.trim() || undefined,
      accountName: manualAccountName.trim() || undefined,
      location: manualLocation.trim(),
      gradeLevel: manualGrade.trim(),
    });
  };

  if (showManualForm) {
    return (
      <div className="space-y-5">
        <div>
          <button
            type="button"
            onClick={() => setShowManualForm(false)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#881337] mb-3 hover:underline"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to school list
          </button>
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
            Add your child's school
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Provide the school details and a contact person. We'll reach out to
            verify your application before disbursement.
          </p>
        </div>

        {manualFormError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {manualFormError}
          </div>
        )}

        <div className="space-y-4">
          {/* School name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Greenfield Academy"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
            />
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              School Contact (Email or Phone){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualContact}
              onChange={(e) => setManualContact(e.target.value)}
              placeholder="e.g. bursar@greenfield.edu or 08012345678"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
            />
            <p className="text-xs text-gray-400">
              Must be an active contact person responsible for school fees.
            </p>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              School Location (Address) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="e.g. 12 School Road, Ikeja, Lagos"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
            />
          </div>

          {/* Grade level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Child's Class / Level <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualGrade}
              onChange={(e) => setManualGrade(e.target.value)}
              placeholder="e.g. JSS 2 or Primary 4"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
            />
          </div>

          {/* Bank details — optional */}
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              School Bank Account Details{" "}
              <span className="font-normal text-gray-400">
                (optional — speeds up disbursement)
              </span>
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Bank Name
              </label>
              <input
                type="text"
                value={manualBankName}
                onChange={(e) => setManualBankName(e.target.value)}
                placeholder="e.g. First Bank"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                value={manualAccountNumber}
                onChange={(e) => setManualAccountNumber(e.target.value)}
                placeholder="10-digit account number"
                maxLength={10}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                value={manualAccountName}
                onChange={(e) => setManualAccountName(e.target.value)}
                placeholder="e.g. Greenfield Academy Ltd"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/15 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={manualSchoolPending}
          className="w-full bg-[#881337] text-white font-bold py-3 rounded-2xl hover:bg-[#4c0519] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {manualSchoolPending ? "Saving…" : "Save School & Continue"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
          Which school does your child attend?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Search for your child's school, or choose from our partnered schools
        </p>
      </div>

      {/* Institution Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Institution Type<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedInstitutionTypeId}
            onChange={(e) => {
              const opt = institutionTypes.find((t) => t.id === e.target.value);
              onInstitutionTypeChange(e.target.value, opt?.name ?? "");
            }}
            disabled={loadingTypes}
            className={
              selectCls() + (loadingTypes ? " opacity-50 cursor-wait" : "")
            }
          >
            <option value="">
              {loadingTypes ? "Loading…" : "-Select type-"}
            </option>
            {institutionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>

      {/* Choose School */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Choose School<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedSchoolId}
            onChange={(e) => {
              const opt = catalogSchools.find((s) => s.id === e.target.value);
              onSchoolChange(e.target.value, opt?.name ?? "");
            }}
            disabled={!selectedInstitutionTypeId || loadingSchools}
            className={
              selectCls() +
              (!selectedInstitutionTypeId || loadingSchools
                ? " opacity-50 cursor-not-allowed"
                : "")
            }
          >
            <option value="">
              {loadingSchools
                ? "Loading schools…"
                : !selectedInstitutionTypeId
                  ? "Select a type first"
                  : "-Choose School-"}
            </option>
            {catalogSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
        {/* "School not listed?" link */}
        {selectedInstitutionTypeId && !loadingSchools && (
          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="mt-1 self-start text-xs font-semibold text-[#881337] hover:underline"
          >
            Can't find your school? Add it manually →
          </button>
        )}
      </div>

      {/* Class / Level */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Class/Level<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedGradeLevel}
            onChange={(e) => onGradeLevelChange(e.target.value)}
            disabled={!selectedSchoolId || loadingClasses}
            className={
              selectCls() +
              (!selectedSchoolId || loadingClasses
                ? " opacity-50 cursor-not-allowed"
                : "")
            }
          >
            <option value="">
              {loadingClasses
                ? "Loading classes…"
                : !selectedSchoolId
                  ? "Select a school first"
                  : "-Choose Class-"}
            </option>
            {flatClasses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>

      {/* ── Academic Session ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Academic Session<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedSessionName}
            disabled={loadingSessions}
            onChange={(e) => onSessionChange(e.target.value)}
            className={
              selectCls() + (loadingSessions ? " opacity-50 cursor-wait" : "")
            }
          >
            <option value="">
              {loadingSessions ? "Loading sessions…" : "— Select session —"}
            </option>
            {sessions.map((s) => (
              <option key={s.id} value={s.sessionName}>
                {s.sessionName}
                {s.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>

      {/* ── Term ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Term<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedTermId}
            disabled={!selectedSessionName || availableTerms.length === 0}
            onChange={(e) => {
              const t = availableTerms.find((x) => x.id === e.target.value);
              onTermChange(e.target.value, t?.termName ?? "");
            }}
            className={
              selectCls() +
              (!selectedSessionName || availableTerms.length === 0
                ? " opacity-50 cursor-not-allowed"
                : "")
            }
          >
            <option value="">
              {!selectedSessionName
                ? "Select a session first"
                : "— Select term —"}
            </option>
            {availableTerms.map((t) => {
              const isOpen = t.status === "ACTIVE_APPLICATION";
              const isClosed =
                t.status === "APPLICATION_CLOSED" || t.status === "COMPLETED";
              return (
                <option key={t.id} value={t.id} disabled={isClosed}>
                  {t.termName}
                  {isOpen ? " ✓ Open" : isClosed ? " (Closed)" : ""}
                </option>
              );
            })}
          </select>
          <ChevronDown />
        </div>

        {/* Amber notice if session chosen but no term is open */}
        {selectedSessionName &&
          availableTerms.length > 0 &&
          !availableTerms.some((t) => t.status === "ACTIVE_APPLICATION") && (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 shrink-0 mt-px"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              No term is currently open for this session. You may still select
              an upcoming term to prepare your application.
            </p>
          )}
      </div>
    </div>
  );
};

const sessionSelectCls =
  "w-full rounded-2xl border border-gray-200 bg-slate-50/50 px-4 py-3 text-sm text-gray-800 " +
  "outline-none focus:border-[#881337] focus:ring-2 focus:ring-[#881337]/10 transition-all cursor-pointer " +
  "disabled:opacity-50 disabled:cursor-not-allowed appearance-none";

const StepSelectSessionTerm: React.FC<{
  sessions: AcademicSessionSummary[];
  loading: boolean;
  selectedSessionName: string;
  selectedTermId: string;
  selectedTermName: string;
  onSessionChange: (sessionName: string) => void;
  onTermChange: (termId: string, termName: string) => void;
}> = ({
  sessions,
  loading,
  selectedSessionName,
  selectedTermId,
  onSessionChange,
  onTermChange,
}) => {
  const activeSession = sessions.find(
    (s) => s.sessionName === selectedSessionName,
  );
  const availableTerms: AcademicTermSummary[] = activeSession?.terms ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
          Academic Session &amp; Term
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select the school session and term you are applying for
        </p>
      </div>

      <div className="space-y-4">
        {/* Session picker */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Academic Session <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className={sessionSelectCls}
              value={selectedSessionName}
              disabled={loading}
              onChange={(e) => onSessionChange(e.target.value)}
            >
              <option value="">
                {loading ? "Loading sessions…" : "— Select session —"}
              </option>
              {sessions.map((s) => (
                <option key={s.id} value={s.sessionName}>
                  {s.sessionName}
                  {s.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Term picker */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Term <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              className={sessionSelectCls}
              value={selectedTermId}
              disabled={!selectedSessionName || availableTerms.length === 0}
              onChange={(e) => {
                const t = availableTerms.find((x) => x.id === e.target.value);
                onTermChange(e.target.value, t?.termName ?? "");
              }}
            >
              <option value="">
                {!selectedSessionName
                  ? "Select a session first"
                  : "— Select term —"}
              </option>
              {availableTerms.map((t) => {
                const isOpen = t.status === "ACTIVE_APPLICATION";
                const isClosed =
                  t.status === "APPLICATION_CLOSED" || t.status === "COMPLETED";
                return (
                  <option key={t.id} value={t.id} disabled={isClosed}>
                    {t.termName}
                    {isOpen ? " ✓ Open" : isClosed ? " (Closed)" : ""}
                  </option>
                );
              })}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Info banner if no open term */}
        {selectedSessionName &&
          availableTerms.length > 0 &&
          !availableTerms.some((t) => t.status === "ACTIVE_APPLICATION") && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                No term is currently open for applications in this session. You
                may still select an upcoming term to prepare your application.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

const StepTuitionDetails: React.FC<{
  tuitionAmount: number;
  selectedPlanId: "3month" | "4month" | null;
  onSelectPlan: (id: "3month" | "4month") => void;
}> = ({ tuitionAmount, selectedPlanId, onSelectPlan }) => {
  const amount = tuitionAmount > 0 ? tuitionAmount : FALLBACK_TUITION_AMOUNT;
  const plans = buildRepaymentPlans(amount);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-2xl font-extrabold text-[#881337]">
          Tuition &amp; repayment details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose a repayment plan that fits your budget
        </p>
      </div>

      <div className="space-y-3 mt-2">
        {plans.map((plan) => {
          const selected = selectedPlanId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                selected
                  ? "border-[#881337] ring-2 ring-[#881337]/15 bg-white"
                  : "border-gray-200 bg-white hover:border-[#881337]/40"
              }`}
            >
              {/* Radio circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? "border-[#881337]" : "border-[#F2C4D0]"
                }`}
              >
                {selected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#881337]" />
                )}
              </div>
              {/* Label — grows to fill space */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{plan.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  {plan.sub}
                </p>
              </div>
              {/* Amount — shows monthly repayment amount */}
              <span className="text-sm font-extrabold text-[#881337] shrink-0 text-right">
                {fmt(
                  plan.monthlyAmount ??
                    Math.round(plan.total / tenorFromPlanId(plan.id)),
                )}
                <span className="text-xs font-semibold text-gray-400">/mo</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary card */}
      {selectedPlan && (
        <div className="rounded-2xl bg-[#FDF0F4] border border-[#F2C4D0] px-4 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tuition (school fees)</span>
            <span className="font-semibold text-gray-900">{fmt(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monthly repayment</span>
            <span className="font-semibold text-gray-900">
              {fmt(
                selectedPlan.monthlyAmount ??
                  Math.round(amount / tenorFromPlanId(selectedPlan.id)),
              )}
            </span>
          </div>
          <div className="border-t border-[#F2C4D0] pt-2 flex justify-between text-sm">
            <span className="font-bold text-[#881337]">
              You repay (principal only)
            </span>
            <span className="font-extrabold text-[#881337]">{fmt(amount)}</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            Service charge is paid separately upfront before disbursement. No
            interest applied.
          </p>
        </div>
      )}
    </div>
  );
};

const ReviewRow: React.FC<{
  label: string;
  value: string;
  onEdit: () => void;
}> = ({ label, value, onEdit }) => (
  <div className="flex items-start justify-between gap-2 py-3 border-b border-gray-100 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
    </div>
    <button
      type="button"
      onClick={onEdit}
      className="shrink-0 mt-0.5 text-gray-400 hover:text-[#881337] transition-colors p-1"
      aria-label={`Edit ${label}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  </div>
);

const StepReview: React.FC<{
  child: Child | null;
  tuitionDetails: TuitionDetails;
  onEditChild: () => void;
  onEditSchool: () => void;
  onEditTuition: () => void;
}> = ({ child, tuitionDetails, onEditChild, onEditSchool, onEditTuition }) => {
  const numAmount = tuitionDetails.tuitionAmount;
  const plans = buildRepaymentPlans(numAmount);
  const selectedPlan = plans.find(
    (p) => p.id === tuitionDetails.repaymentPlanId,
  );
  const planLabel = selectedPlan?.label ?? tuitionDetails.repaymentPlanId;


  const [schoolDetail, setSchoolDetail] = useState<{
    tier: string | null;
    serviceChargeRate: number | null;
    serviceChargeDisplay: string | null;
    isRegistered: boolean;
  } | null>(null);

  useEffect(() => {
    if (!tuitionDetails.schoolId || tuitionDetails.isManualSchool) return;
    apiClient
      .get(`/catalog/schools/${tuitionDetails.schoolId}`)
      .then((res) => {
        const d = res.data?.data;
        if (d) setSchoolDetail(d);
      })
      .catch(() => {
      });
  }, [tuitionDetails.schoolId, tuitionDetails.isManualSchool]);

  const backendServiceChargeRate = schoolDetail?.serviceChargeRate ?? null;
  const displayServiceCharge =
    backendServiceChargeRate !== null
      ? Math.round(numAmount * backendServiceChargeRate)
      : selectedPlan
        ? Math.round(numAmount * selectedPlan.serviceFeeRate)
        : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-2xl font-extrabold text-[#881337]">
          Review your application
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Check everything looks right before you submit
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-5 py-1">
        <ReviewRow
          label="Child"
          value={child ? `${child.firstName} ${child.lastName}` : "—"}
          onEdit={onEditChild}
        />
        <ReviewRow
          label="School"
          value={tuitionDetails.schoolName || "—"}
          onEdit={onEditSchool}
        />
        <ReviewRow
          label="Class / Level"
          value={tuitionDetails.gradeLevel || "—"}
          onEdit={onEditSchool}
        />
        <ReviewRow
          label="Session / Term"
          value={
            tuitionDetails.academicSession && tuitionDetails.term
              ? `${tuitionDetails.academicSession} - ${tuitionDetails.term}`
              : "—"
          }
          onEdit={onEditTuition}
        />
        <ReviewRow
          label="Repayment plan"
          value={planLabel}
          onEdit={onEditTuition}
        />

        {/* School tier & charges — from backend */}
        {schoolDetail && !tuitionDetails.isManualSchool && (
          <div className="mt-1 mb-2 rounded-xl bg-[#FDF4F7] border border-[#F2C4D0] px-4 py-3 space-y-1.5">
            <p className="text-xs font-bold text-[#881337] uppercase tracking-wide mb-2">
              School Charges &amp; Tier
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">School Tier</span>
              <span className="font-semibold text-gray-900">
                {schoolDetail.tier ? `Tier ${schoolDetail.tier}` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Charge Rate</span>
              <span className="font-semibold text-gray-900">
                {schoolDetail.serviceChargeDisplay ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Charge Amount</span>
              <span className="font-semibold text-[#881337]">
                {fmt(displayServiceCharge)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">School Type</span>
              <span
                className={`font-semibold ${schoolDetail.isRegistered ? "text-green-700" : "text-amber-700"}`}
              >
                {schoolDetail.isRegistered
                  ? "Registered Partner"
                  : "Unregistered"}
              </span>
            </div>
          </div>
        )}

        {tuitionDetails.isManualSchool && (
          <div className="mt-1 mb-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Unregistered school:</span> Your
              application will be sent to the school contact you provided for
              verification before disbursement.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 pb-2">
          <span className="text-sm font-bold text-[#881337]">
            School fees to be financed
          </span>
          <span className="text-base font-extrabold text-[#881337]">
            {fmt(numAmount)}
          </span>
        </div>
        {displayServiceCharge > 0 && (
          <div className="flex items-center justify-between pb-3 border-t border-gray-100 pt-2">
            <span className="text-xs text-gray-400">
              Service charge (paid upfront, not added to repayment)
            </span>
            <span className="text-sm font-semibold text-gray-500">
              {fmt(displayServiceCharge)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const StepConfirmation: React.FC<{
  child: Child | null;
  tuitionDetails: TuitionDetails;
  referenceNumber: string;
  onDashboard: () => void;
  onNewApplication: () => void;
}> = ({
  child,
  tuitionDetails,
  referenceNumber,
  onDashboard,
  onNewApplication,
}) => {
  const numAmount = tuitionDetails.tuitionAmount;

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-10 px-2 sm:px-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md w-full max-w-sm sm:max-w-md px-5 sm:px-8 py-8 sm:py-10 text-center">
        {/* Success icon */}
        <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 sm:w-10 sm:h-10"
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

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#881337] mb-2">
          Application submitted
        </h2>
        <p className="text-sm text-gray-500 mb-1 leading-relaxed">
          We've received{" "}
          {child ? `${child.firstName} ${child.lastName}'s` : "your"}{" "}
          application for {tuitionDetails.schoolName}. You'll get an update once
          it's reviewed.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Ref:{" "}
          <span className="font-bold text-[#881337] break-all">
            {referenceNumber}
          </span>
        </p>

        {/* Status summary */}
        <div className="rounded-2xl bg-[#FDF9EE] border border-[#F0E0A0] px-4 py-4 mb-6 text-left space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Status</span>
            <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1">
              Under review
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">School fees financed</span>
            <span className="text-sm font-extrabold text-[#881337]">
              {fmt(numAmount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onDashboard}
            className="flex-1 rounded-full border-2 border-[#881337] text-[#881337] font-bold py-2.5 text-sm hover:bg-[#881337]/5 transition-colors"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={onNewApplication}
            className="flex-1 rounded-full bg-[#881337] text-white font-bold py-2.5 text-sm hover:bg-[#4c0519] transition-colors shadow-sm"
          >
            New Application
          </button>
        </div>
      </div>
    </div>
  );
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
      "fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[9999]",
      "flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg",
      "bg-white border border-red-200 text-red-700 text-sm font-medium",
      "transition-all duration-300 ease-out",
      "sm:max-w-sm",
      visible
        ? "opacity-100 translate-y-0"
        : "opacity-0 -translate-y-2 pointer-events-none",
    ].join(" ")}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 shrink-0 text-red-500"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <span className="flex-1 text-xs sm:text-sm">{message}</span>
    <button
      type="button"
      onClick={onDismiss}
      className="text-red-400 hover:text-red-600 transition-colors ml-1 shrink-0"
      aria-label="Dismiss"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
);

const StudentDetailsPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 5000);
  }, []);
  const dismissToast = useCallback(() => setToastVisible(false), []);

  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [blockedStudentIds, setBlockedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    parentService
      .getApplications()
      .then((data) => {
        const raw = Array.isArray(data)
          ? (data as Array<{
              studentId?: string;
              status?: string;
              createdAt?: string;
            }>)
          : [];

        const now = new Date();
        const termMonthStart = Math.floor(now.getMonth() / 4) * 4;
        const termStart = new Date(now.getFullYear(), termMonthStart, 1);
        const termEnd = new Date(now.getFullYear(), termMonthStart + 4, 1);
        const INACTIVE = new Set(["rejected", "cancelled"]);

        const blocked = new Set<string>();
        for (const app of raw) {
          if (!app.studentId || !app.createdAt) continue;
          if (INACTIVE.has(app.status ?? "")) continue;
          const d = new Date(app.createdAt);
          if (d >= termStart && d < termEnd) blocked.add(app.studentId);
        }
        setBlockedStudentIds(blocked);
      })
      .catch(() => {
      });
  }, []);

  useEffect(() => {
    parentService
      .getStudents()
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        if (raw.length === 0) return;

        const normalized: Child[] = (
          raw as Array<{
            id: string;
            firstName: string;
            lastName: string;
            gradeLevel?: string;
            tuitionAmount?: number;
            schoolId?: string;
            school?: { id?: string; schoolName?: string };
          }>
        ).map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          gradeLevel: s.gradeLevel,
          tuitionAmount: s.tuitionAmount ?? 0,
          schoolId: s.school?.id ?? s.schoolId,
          schoolName: s.school?.schoolName,
          photo: undefined, 
        }));

        setChildren(normalized);
      })
      .catch(() => {
      });
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const [institutionTypes, setInstitutionTypes] = useState<
    CatalogInstitutionType[]
  >([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [selectedInstitutionTypeId, setSelectedInstitutionTypeId] =
    useState("");
  const [selectedInstitutionTypeName, setSelectedInstitutionTypeName] =
    useState("");

  const [catalogSchools, setCatalogSchools] = useState<CatalogSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");

  const [classLevelGroups, setClassLevelGroups] = useState<
    CatalogClassLevelGroup[]
  >([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");
  const [_schools] = useState<School[]>(MOCK_SCHOOLS);
  void _schools;
  void ACADEMIC_SESSIONS;
  void TERMS;

  useEffect(() => {
    if (step !== 2) return;
    setLoadingTypes(true);
    catalogService
      .getInstitutionTypes()
      .then(setInstitutionTypes)
      .catch(() => showToast("Failed to load institution types."))
      .finally(() => setLoadingTypes(false));
  }, [step, showToast]);

  useEffect(() => {
    if (!selectedInstitutionTypeId) {
      setCatalogSchools([]);
      return;
    }
    setLoadingSchools(true);
    setCatalogSchools([]);
    catalogService
      .getSchools(selectedInstitutionTypeId)
      .then(setCatalogSchools)
      .catch(() => showToast("Failed to load schools."))
      .finally(() => setLoadingSchools(false));
  }, [selectedInstitutionTypeId, showToast]);

  useEffect(() => {
    if (!selectedSchoolId || !selectedInstitutionTypeId) {
      setClassLevelGroups([]);
      return;
    }
    setLoadingClasses(true);
    setClassLevelGroups([]);
    catalogService
      .getClassLevels(selectedSchoolId, selectedInstitutionTypeId)
      .then(setClassLevelGroups)
      .catch(() => showToast("Failed to load class levels."))
      .finally(() => setLoadingClasses(false));
  }, [selectedSchoolId, selectedInstitutionTypeId, showToast]);

  const [sessions, setSessions] = useState<AcademicSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionName, setSelectedSessionName] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedTermName, setSelectedTermName] = useState("");

  useEffect(() => {
    if (step !== 2) return;
    setLoadingSessions(true);
    catalogService
      .getSessions()
      .then((data) => {
        setSessions(data);
        const current = data.find((s) => s.isCurrent);
        if (current && !selectedSessionName) {
          setSelectedSessionName(current.sessionName);
          const activeTerm = current.terms.find(
            (t) => t.status === "ACTIVE_APPLICATION",
          );
          if (activeTerm && !selectedTermId) {
            setSelectedTermId(activeTerm.id);
            setSelectedTermName(activeTerm.termName);
          }
        }
      })
      .catch(() => showToast("Failed to load academic sessions."))
      .finally(() => setLoadingSessions(false));
  }, [step, showToast]); 

  const [selectedPlanId, setSelectedPlanId] = useState<
    "3month" | "4month" | null
  >(null);

  const [isManualSchool, setIsManualSchool] = useState(false);
  const [manualSchoolPending, setManualSchoolPending] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const childTuitionAmount = selectedChild?.tuitionAmount ?? 0;

  const tuitionDetails: TuitionDetails = {
    institutionTypeId: selectedInstitutionTypeId,
    institutionTypeName: selectedInstitutionTypeName,
    schoolId: selectedSchoolId,
    schoolName: selectedSchoolName,
    gradeLevel: selectedGradeLevel,
    tuitionAmount:
      childTuitionAmount > 0 ? childTuitionAmount : FALLBACK_TUITION_AMOUNT,
    repaymentPlanId: selectedPlanId ?? "3month",
    academicSession: selectedSessionName,
    term: selectedTermName,
    termId: selectedTermId,
    isManualSchool,
  };

  const handleBack = (): void => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleManualSchoolSubmit = useCallback(
    async (data: ManualSchoolData) => {
      setManualSchoolPending(true);
      try {
        await parentService.requestSchool({
          schoolName: data.schoolName,
          schoolAddress: data.location,
          contactPhone: data.contact.match(/^\+?[0-9]/)
            ? data.contact
            : undefined,
          contactEmail: !data.contact.match(/^\+?[0-9]/)
            ? data.contact
            : undefined,
          additionalNotes: data.bankName
            ? `Bank: ${data.bankName}, Account: ${data.accountNumber ?? "N/A"}, Account Name: ${data.accountName ?? "N/A"}`
            : undefined,
        });
        setSelectedSchoolId("manual");
        setSelectedSchoolName(data.schoolName);
        setSelectedGradeLevel(data.gradeLevel);
        setIsManualSchool(true);
        setStep(3);
      } catch {
        showToast("Failed to save school details. Please try again.");
      } finally {
        setManualSchoolPending(false);
      }
    },
    [showToast],
  );

  const handleSubmitApplication = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await parentService.submitWizardApplication({
        childId: selectedChildId!,
        schoolId: selectedSchoolId,
        institutionTypeId: selectedInstitutionTypeId,
        institutionTypeName: selectedInstitutionTypeName,
        gradeLevel: selectedGradeLevel,
        tuitionAmount:
          childTuitionAmount > 0 ? childTuitionAmount : FALLBACK_TUITION_AMOUNT,
        repaymentPlanId: selectedPlanId ?? "3month",
        tenor: tenorFromPlanId(selectedPlanId ?? "3month"),
        academicSession: selectedSessionName,
        term: selectedTermName,
      });

      const ref =
        (result as { referenceNumber?: string })?.referenceNumber ??
        (result as { referenceNumbers?: string[] })?.referenceNumbers?.[0] ??
        `SKC-${Date.now()}`;

      setSubmittedRef(ref);
      setStep(5);
    } catch (err) {
      const axErr = err as import("axios").AxiosError<{ message?: string }>;
      showToast(
        axErr.response?.data?.message ??
          (err as Error).message ??
          "Failed to submit application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    selectedChildId,
    selectedSchoolId,
    selectedInstitutionTypeId,
    selectedInstitutionTypeName,
    selectedGradeLevel,
    childTuitionAmount,
    selectedPlanId,
    selectedSessionName,
    selectedTermName,
    showToast,
  ]);

  const handleContinue = useCallback(() => {
    if (step === 1 && !selectedChildId) return;
    if (step === 2) {
      if (
        !selectedInstitutionTypeId ||
        !selectedSchoolId ||
        !selectedGradeLevel
      ) {
        showToast("Please select institution type, school, and class.");
        return;
      }
      if (!isManualSchool && (!selectedSessionName || !selectedTermId)) {
        showToast("Please select an academic session and term.");
        return;
      }
    }
    if (step === 3 && !selectedPlanId) {
      showToast("Please select a repayment plan.");
      return;
    }
    if (step === 4) {
      void handleSubmitApplication();
      return;
    }
    if (step < 4) setStep((s) => (s + 1) as Step);
  }, [
    step,
    selectedChildId,
    selectedInstitutionTypeId,
    selectedSchoolId,
    selectedGradeLevel,
    selectedSessionName,
    selectedTermId,
    selectedPlanId,
    showToast,
    handleSubmitApplication,
  ]);

  const continueDisabled =
    (step === 1 &&
      (!selectedChildId || blockedStudentIds.has(selectedChildId ?? ""))) ||
    (step === 2 &&
      (!selectedInstitutionTypeId ||
        !selectedSchoolId ||
        !selectedGradeLevel ||
        (!isManualSchool && (!selectedSessionName || !selectedTermId)))) ||
    (step === 3 && !selectedPlanId) ||
    (step === 4 && isSubmitting);

  const continueLabel = step === 4 ? "Submit Application" : "Continue";

  return (
    <div className="pb-24 pt-4 sm:pt-6 animate-fade-in-up px-4 sm:px-6 w-full">
      <Toast
        message={toastMsg}
        visible={toastVisible}
        onDismiss={dismissToast}
      />

      {/* Page header */}
      {step !== 5 && (
        <div className="mt-4 sm:mt-8 mb-5 sm:mb-8">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {step === 1 ? "Applications" : "New Tuition Application"}
          </p>
          <div className="flex items-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 rounded-lg text-[#881337] hover:bg-[#881337]/10 transition-colors shrink-0 mt-0.5"
              aria-label="Go back"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight">
                {step === 1
                  ? "Start new application"
                  : "New Tuition Application"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a new tuition application for your child
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stepper */}
      {step !== 5 && (
        <div className="mb-5 sm:mb-6">
          <Stepper current={step} completedChild={selectedChild} />
        </div>
      )}

      {/* Step content */}
      <div>
        {step === 1 && (
          <StepSelectChild
            children={children}
            selectedId={selectedChildId}
            onSelect={setSelectedChildId}
            blockedStudentIds={blockedStudentIds}
            onAddNew={() => navigate("/parent/eligibility")}
          />
        )}

        {step === 2 && (
          <StepSelectSchool
            institutionTypes={institutionTypes}
            catalogSchools={catalogSchools}
            classLevelGroups={classLevelGroups}
            loadingTypes={loadingTypes}
            loadingSchools={loadingSchools}
            loadingClasses={loadingClasses}
            selectedInstitutionTypeId={selectedInstitutionTypeId}
            selectedSchoolId={selectedSchoolId}
            selectedGradeLevel={selectedGradeLevel}
            onInstitutionTypeChange={(id, name) => {
              setSelectedInstitutionTypeId(id);
              setSelectedInstitutionTypeName(name);
              setSelectedSchoolId("");
              setSelectedSchoolName("");
              setSelectedGradeLevel("");
              setIsManualSchool(false);
            }}
            onSchoolChange={(id, name) => {
              setSelectedSchoolId(id);
              setSelectedSchoolName(name);
              setSelectedGradeLevel("");
              setIsManualSchool(false);
            }}
            onGradeLevelChange={setSelectedGradeLevel}
            sessions={sessions}
            loadingSessions={loadingSessions}
            selectedSessionName={selectedSessionName}
            selectedTermId={selectedTermId}
            onSessionChange={(name) => {
              setSelectedSessionName(name);
              setSelectedTermId("");
              setSelectedTermName("");
            }}
            onTermChange={(id, name) => {
              setSelectedTermId(id);
              setSelectedTermName(name);
            }}
            onManualSchoolSubmit={handleManualSchoolSubmit}
            manualSchoolPending={manualSchoolPending}
          />
        )}

        {step === 3 && (
          <StepTuitionDetails
            tuitionAmount={childTuitionAmount}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
          />
        )}

        {step === 4 && (
          <StepReview
            child={selectedChild}
            tuitionDetails={tuitionDetails}
            onEditChild={() => setStep(1)}
            onEditSchool={() => setStep(2)}
            onEditTuition={() => setStep(3)}
          />
        )}

        {step === 5 && (
          <StepConfirmation
            child={selectedChild}
            tuitionDetails={tuitionDetails}
            referenceNumber={submittedRef}
            onDashboard={() => navigate("/parent/dashboard")}
            onNewApplication={() => {
              setStep(1);
              setSelectedChildId(null);
              setSelectedInstitutionTypeId("");
              setSelectedInstitutionTypeName("");
              setSelectedSchoolId("");
              setSelectedSchoolName("");
              setSelectedGradeLevel("");
              setSelectedSessionName("");
              setSelectedTermId("");
              setSelectedTermName("");
              setSelectedPlanId(null);
              setSubmittedRef("");
              setIsManualSchool(false);
            }}
          />
        )}
      </div>

      <NavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={continueDisabled}
        continueLabel={continueLabel}
        loading={isSubmitting}
        hidden={step === 5}
      />
    </div>
  );
};

export default StudentDetailsPage;
