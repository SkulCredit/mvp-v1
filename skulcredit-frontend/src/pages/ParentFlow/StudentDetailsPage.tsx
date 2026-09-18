import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  parentService,
  catalogService,
  CatalogInstitutionType,
  CatalogSchool,
  CatalogClassLevelGroup,
} from "../../services/parentService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  schoolName?: string;
  schoolId?: string;
  photo?: string;
  /** Tuition amount from the student record — used to pre-fill repayment plans */
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
  id: "full" | "3month" | "6month";
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
  repaymentPlanId: "full" | "3month" | "6month";
  academicSession: string;
  term: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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

// Fallback display amount when a child has no tuitionAmount on record yet
const FALLBACK_TUITION_AMOUNT = 450_000;

const STEPS: { label: string; short: string }[] = [
  { label: "Select Child", short: "Child" },
  { label: "Select School", short: "School" },
  { label: "Tuition Details", short: "Tuition" },
  { label: "Review", short: "Review" },
  { label: "Submit", short: "Submit" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "₦" +
  n.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function buildRepaymentPlans(tuitionAmount: number): RepaymentPlan[] {
  const fee3 = Math.round(tuitionAmount * 0.04);
  const fee6 = Math.round(tuitionAmount * 0.07);
  return [
    {
      id: "full",
      label: "Full payment",
      sub: "Pay once, no fees",
      total: tuitionAmount,
      serviceFeeRate: 0,
    },
    {
      id: "3month",
      label: "3-month plan",
      sub: `${fmt(Math.round((tuitionAmount + fee3) / 3))}/mo · 4% fee`,
      total: tuitionAmount + fee3,
      monthlyAmount: Math.round((tuitionAmount + fee3) / 3),
      serviceFeeRate: 0.04,
    },
    {
      id: "6month",
      label: "6-month plan",
      sub: `${fmt(Math.round((tuitionAmount + fee6) / 6))}/mo · 7% fee`,
      total: tuitionAmount + fee6,
      monthlyAmount: Math.round((tuitionAmount + fee6) / 6),
      serviceFeeRate: 0.07,
    },
  ];
}

function tenorFromPlanId(id: "full" | "3month" | "6month"): number {
  if (id === "3month") return 3;
  if (id === "6month") return 6;
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper — shows short labels on mobile, full labels on sm+
// ─────────────────────────────────────────────────────────────────────────────

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
            {/* Short label on mobile, full label on sm+ */}
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

// ─────────────────────────────────────────────────────────────────────────────
// NavBar — fixed bottom bar, stacks gracefully on small screens
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Select Child
// ─────────────────────────────────────────────────────────────────────────────

const StepSelectChild: React.FC<{
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}> = ({ children, selectedId, onSelect, onAddNew }) => (
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
            return (
              <div
                key={child.id}
                onClick={() => onSelect(child.id)}
                className={`flex items-center gap-3 bg-white rounded-2xl border px-3 sm:px-5 py-3 sm:py-4 cursor-pointer transition-all ${
                  selected
                    ? "border-[#881337] ring-2 ring-[#881337]/20"
                    : "border-gray-200 hover:border-[#881337]/40"
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
                {/* Radio dot only — no extra "Select" button to avoid cramping */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-[#881337]" : "border-gray-300"}`}
                >
                  {selected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#881337]" />
                  )}
                </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Select School
// ─────────────────────────────────────────────────────────────────────────────

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
}) => {
  const flatClasses = classLevelGroups.flatMap((g) => g.classes);

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
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Tuition Details
// ─────────────────────────────────────────────────────────────────────────────

const StepTuitionDetails: React.FC<{
  /** Actual tuition amount from the selected child's record */
  tuitionAmount: number;
  selectedPlanId: "full" | "3month" | "6month" | null;
  onSelectPlan: (id: "full" | "3month" | "6month") => void;
}> = ({ tuitionAmount, selectedPlanId, onSelectPlan }) => {
  // Use child's tuition amount, fall back to ₦450,000 for display when 0
  const amount = tuitionAmount > 0 ? tuitionAmount : FALLBACK_TUITION_AMOUNT;
  const plans = buildRepaymentPlans(amount);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  const serviceFee = selectedPlan
    ? Math.round(amount * selectedPlan.serviceFeeRate)
    : 0;
  const total = selectedPlan ? selectedPlan.total : amount;

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
              {/* Amount — never shrinks, wraps below on very small screens */}
              <span className="text-sm font-extrabold text-[#881337] shrink-0 text-right">
                {fmt(plan.total)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary card */}
      {selectedPlan && (
        <div className="rounded-2xl bg-[#FDF0F4] border border-[#F2C4D0] px-4 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tuition amount</span>
            <span className="font-semibold text-gray-900">{fmt(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service fee</span>
            <span className="font-semibold text-gray-900">
              {fmt(serviceFee)}
            </span>
          </div>
          <div className="border-t border-[#F2C4D0] pt-2 flex justify-between text-sm">
            <span className="font-bold text-[#881337]">Total</span>
            <span className="font-extrabold text-[#881337]">{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Review
// ─────────────────────────────────────────────────────────────────────────────

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
  const total = selectedPlan?.total ?? numAmount;
  const planLabel = selectedPlan?.label ?? tuitionDetails.repaymentPlanId;

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

        <div className="flex items-center justify-between pt-4 pb-2">
          <span className="text-sm font-bold text-[#881337]">
            Total amount due
          </span>
          <span className="text-base font-extrabold text-[#881337]">
            {fmt(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Confirmation
// ─────────────────────────────────────────────────────────────────────────────

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
  const plans = buildRepaymentPlans(numAmount);
  const selectedPlan = plans.find(
    (p) => p.id === tuitionDetails.repaymentPlanId,
  );
  const total = selectedPlan?.total ?? numAmount;

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
            <span className="text-sm text-gray-500">Total amount</span>
            <span className="text-sm font-extrabold text-[#881337]">
              {fmt(total)}
            </span>
          </div>
        </div>

        {/* CTA — stacks on very small screens */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Step 1: child ──────────────────────────────────────────────────────────
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    parentService
      .getStudents()
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        if (raw.length === 0) return;

        // The API returns students with a nested `school` object.
        // Normalize into the flat Child shape the component expects.
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
          photo: undefined, // Student model has no photo field
        }));

        setChildren(normalized);
      })
      .catch(() => {
        // Keep mock children as fallback so UI doesn't go blank
      });
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  // ── Step 2: school ─────────────────────────────────────────────────────────
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

  // Unused but kept to avoid breaking imports
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

  // ── Step 3: repayment plan + tuition amount ───────────────────────────────
  const [selectedPlanId, setSelectedPlanId] = useState<
    "full" | "3month" | "6month" | null
  >(null);

  // ── Step 5: result ─────────────────────────────────────────────────────────
  const [submittedRef, setSubmittedRef] = useState("");

  // Tuition amount from the selected child — falls back to 0 (shown as ₦450,000 on cards)
  const childTuitionAmount = selectedChild?.tuitionAmount ?? 0;

  const tuitionDetails: TuitionDetails = {
    institutionTypeId: selectedInstitutionTypeId,
    institutionTypeName: selectedInstitutionTypeName,
    schoolId: selectedSchoolId,
    schoolName: selectedSchoolName,
    gradeLevel: selectedGradeLevel,
    // Use the same amount StepTuitionDetails shows on the plan cards
    tuitionAmount:
      childTuitionAmount > 0 ? childTuitionAmount : FALLBACK_TUITION_AMOUNT,
    repaymentPlanId: selectedPlanId ?? "full",
    academicSession: "",
    term: "",
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleBack = (): void => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

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
        repaymentPlanId: selectedPlanId ?? "full",
        tenor: tenorFromPlanId(selectedPlanId ?? "full"),
      });

      const ref =
        (result as { referenceNumber?: string })?.referenceNumber ??
        (result as { referenceNumbers?: string[] })?.referenceNumbers?.[0] ??
        `SKC-${Date.now()}`;

      setSubmittedRef(ref);
      setStep(5);
    } catch (err) {
      showToast(
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
    showToast,
  ]);

  const handleContinue = useCallback(() => {
    if (step === 1 && !selectedChildId) return;
    if (
      step === 2 &&
      (!selectedInstitutionTypeId || !selectedSchoolId || !selectedGradeLevel)
    ) {
      showToast("Please select institution type, school, and class.");
      return;
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
    selectedPlanId,
    showToast,
    handleSubmitApplication,
  ]);

  const continueDisabled =
    (step === 1 && !selectedChildId) ||
    (step === 2 &&
      (!selectedInstitutionTypeId ||
        !selectedSchoolId ||
        !selectedGradeLevel)) ||
    (step === 3 && !selectedPlanId) ||
    (step === 4 && isSubmitting);

  const continueLabel = step === 4 ? "Submit Application" : "Continue";

  return (
    /* Full-width on mobile, constrained + centered on desktop */
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
            }}
            onSchoolChange={(id, name) => {
              setSelectedSchoolId(id);
              setSelectedSchoolName(name);
              setSelectedGradeLevel("");
            }}
            onGradeLevelChange={setSelectedGradeLevel}
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
              setSelectedPlanId(null);
              setSubmittedRef("");
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
