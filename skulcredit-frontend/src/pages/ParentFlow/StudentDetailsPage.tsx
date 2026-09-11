import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { parentService } from "../../services/parentService";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  schoolName?: string;
  schoolId?: string;
  photo?: string;
}

interface School {
  id: string;
  schoolName: string;
  addressCity?: string;
  addressState?: string;
  logo?: string;
  levels?: string[];
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
    schoolName: "Peershores Academy",
    addressCity: "Lagos",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s2",
    schoolName: "Peershores Academy",
    addressCity: "Abuja",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s3",
    schoolName: "Peershores Academy",
    addressCity: "Port Harcourt",
    levels: ["Primary", "Secondary"],
  },
  {
    id: "s4",
    schoolName: "Peershores Academy",
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

const STEPS: { label: string }[] = [
  { label: "Select Child" },
  { label: "Select School" },
  { label: "Tuition Details" },
  { label: "Review" },
  { label: "Submit Application" },
];

const Stepper: React.FC<{ current: Step; completedChild?: Child | null }> = ({
  current,
  completedChild,
}) => (
  <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-5 flex items-center justify-between gap-2 overflow-hidden ">
    {STEPS.map((s, i) => {
      const num = (i + 1) as Step;
      const done = num < current;
      const active = num === current;

      return (
        <React.Fragment key={num}>
          <div className="flex flex-col items-center gap-1.5 shrink-0 relative z-10">
            {done && num === 1 && completedChild && (
              <img
                src={
                  completedChild.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(completedChild.firstName)}&background=881337&color=fff&size=36`
                }
                alt={completedChild.firstName}
                className="absolute -top-4 w-9 h-9 rounded-full object-cover ring-2 ring-white shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(completedChild.firstName)}&background=881337&color=fff&size=36`;
                }}
              />
            )}

            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? "bg-brand text-white"
                  : active
                    ? "bg-brand text-white ring-4 ring-brand/20"
                    : "border-2 border-gray-200 text-gray-400 bg-white"
              }`}
            >
              {done ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                num
              )}
            </div>

            <span
              className={`text-[10px] sm:text-[11px] font-semibold whitespace-nowrap hidden sm:block ${active ? "text-brand" : done ? "text-gray-500" : "text-gray-400"}`}
            >
              {s.label}
            </span>
          </div>

          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px transition-colors ${num < current ? "bg-brand/40" : "bg-gray-200"}`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Bottom nav bar
// ─────────────────────────────────────────────────────────────────────────────

const NavBar: React.FC<{
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
}> = ({
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continue",
}) => (
  <div className="fixed bottom-0 left-0 w-full px-6 sm:px-8 py-8 z-50">
    <div className="flex items-center justify-between">
      {/* Back — outlined brand pill */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 border-2 border-brand text-brand font-bold px-5 py-2.5 rounded-full hover:bg-brand/5 transition-colors text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
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

      {/* Continue — light pink when disabled, solid brand when active */}
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className={`inline-flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-sm transition-all ${
          continueDisabled
            ? "bg-brand/20 text-brand/50 cursor-not-allowed"
            : "bg-brand text-white hover:bg-brand-hover shadow-sm"
        }`}
      >
        {continueLabel}
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
      </button>
    </div>
  </div>
);

const StepSelectChild: React.FC<{
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}> = ({ children, selectedId, onSelect, onAddNew }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
        Who are you applying for?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Select a child already on your account, or add a new child to continue
      </p>
    </div>

    {children.length > 0 && (
      <div className="mt-10">
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
                    ? "border-brand ring-2 ring-brand/20"
                    : "border-gray-200 hover:border-brand/40"
                }`}
              >
                {/* Avatar — smaller on mobile */}
                <img
                  src={
                    child.photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(child.firstName)}&background=881337&color=fff&size=44`
                  }
                  alt={child.firstName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(child.firstName)}&background=881337&color=fff&size=44`;
                  }}
                />

                {/* Info — truncate long text */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {child.firstName} {child.lastName}
                  </p>
                  {child.schoolName && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400 truncate">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
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
                        xmlns="http://www.w3.org/2000/svg"
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

                {/* Radio + Select — compact on mobile */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected ? "border-brand" : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(child.id);
                    }}
                    className={`border-2 rounded-full px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-brand text-brand hover:bg-brand/5"
                    }`}
                  >
                    {selected ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    <button
      type="button"
      onClick={onAddNew}
      className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-200 hover:border-brand/40 px-3 sm:px-5 py-3 sm:py-4 transition-all text-left group"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-brand"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">Add a new child</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Add your child's details once. You can use their profile for future
          applications
        </p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors shrink-0"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
);

const StepSelectSchool: React.FC<{
  schools: School[];
  selectedId: string | null;
  onSelect: (school: School) => void;
  search: string;
  onSearchChange: (v: string) => void;
}> = ({ schools, selectedId, onSelect, search, onSearchChange }) => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const filtered = search.trim()
    ? schools.filter(
        (s) =>
          s.schoolName.toLowerCase().includes(search.toLowerCase()) ||
          (s.addressCity ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : schools;

  return (
    <div className="space-y-6 mt-8">
      {/* Heading */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Which school does your child attend?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Search for your child's school, or choose from our
          <br />
          partnered schools
        </p>
      </div>

      {/* Search bar — soft pink pill, full width on all devices */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-brand/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for a school"
          className="w-full sm:max-w-lg rounded-lg border border-brand/25 bg-[#FDF0F4] pl-10 pr-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="mt-10">
        <p className="text-sm font-bold text-gray-800 mb-5">
          {search.trim() ? "Search Results" : "Popular Partner Schools"}
        </p>

        {filtered.length === 0 ? (
          <div className="text-sm text-gray-400 py-8 text-center">
            No schools found matching "{search}"
          </div>
        ) : (
          /* Horizontal scroll carousel — all devices */
          <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 sm:-mx-8 px-4 sm:px-8 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.map((school) => {
              const selected = selectedId === school.id;
              const [first, ...rest] = school.schoolName.split(" ");
              const sub = rest.join(" ") || school.addressCity || "";

              return (
                <div
                  key={school.id}
                  onClick={() => onSelect(school)}
                  onMouseEnter={() => setHoveredId(school.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="flex flex-col items-start gap-2 cursor-pointer group shrink-0 w-36 sm:w-44"
                >
                  {/* Logo circle */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-2 ring-transparent group-hover:ring-brand/30 transition-all">
                    <img
                      src={school.logo ?? "/Ellipse.svg"}
                      alt={school.schoolName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/Ellipse.svg";
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div className="w-full">
                    <p className="font-bold text-gray-900 text-sm leading-snug">
                      {first}
                    </p>
                    {sub && (
                      <p className="text-sm text-gray-400 leading-snug">
                        {sub}
                      </p>
                    )}
                  </div>

                  {/* Level tags */}
                  {school.levels && school.levels.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {school.levels.map((lvl, i) => (
                        <span key={lvl}>
                          {i > 0 && (
                            <span
                              className="mx-1 text-gray-300"
                              aria-hidden="true"
                            >
                              •
                            </span>
                          )}
                          {lvl}
                        </span>
                      ))}
                    </p>
                  )}

                  {/* Select pill — visible only on hover or when already selected */}
                  {(selected || hoveredId === school.id) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(school);
                      }}
                      className={`mt-1 rounded-full px-5 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                        selected
                          ? "bg-brand text-white ring-2 ring-brand/30"
                          : "bg-brand text-white hover:bg-brand-hover"
                      }`}
                    >
                      {selected ? "Selected ✓" : "Select"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


const StepStub: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-brand"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </div>
    <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold px-3 py-1">
      Coming soon
    </span>
  </div>
);

const StudentDetailsPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  void addingNew;

  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    parentService
      .getStudents()
      .then((data) => {
        const arr = Array.isArray(data) ? (data as Child[]) : [];
        if (arr.length > 0) setChildren(arr);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    parentService
      .getSchoolDirectory({ search: schoolSearch || undefined, limit: 20 })
      .then((data) => {
        const arr = Array.isArray(data)
          ? data
          : ((data as { schools?: School[] })?.schools ?? []);
        if ((arr as School[]).length > 0) setSchools(arr as School[]);
      })
      .catch(() => {});
  }, [step, schoolSearch]);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const handleContinue = useCallback(() => {
    if (step < 5) setStep((s) => (s + 1) as Step);
    else navigate("/parent/service-charge");
  }, [step, navigate]);

  const continueDisabled =
    (step === 1 && !selectedChildId) || (step === 2 && !selectedSchool);

  const pageTitle = step === 1 ? "Applications" : "New Tuition Application";
  const handleBack = (): void => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };
  return (
    <div className="pb-28 pt-6 animate-fade-in-up px-4 sm:px-8 w-[90%] mx-auto">
      <div className="mt-8 mb-8">
        <p className="text-xs font-semibold text-gray-500 mb-1">{pageTitle}</p>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 mt-0.5"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
              Start New Application
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Create a new tuition application for another child
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Stepper current={step} completedChild={selectedChild} />

        {step === 1 && (
          <StepSelectChild
            children={children}
            selectedId={selectedChildId}
            onSelect={setSelectedChildId}
            onAddNew={() => setAddingNew(true)}
          />
        )}

        {step === 2 && (
          <StepSelectSchool
            schools={schools}
            selectedId={selectedSchool?.id ?? null}
            onSelect={setSelectedSchool}
            search={schoolSearch}
            onSearchChange={setSchoolSearch}
          />
        )}

        {step === 3 && (
          <StepStub
            title="Tuition Details"
            description="Enter the tuition amount and term details for this application."
          />
        )}

        {step === 4 && (
          <StepStub
            title="Review Application"
            description="Review all your details before submitting the application."
          />
        )}

        {step === 5 && (
          <StepStub
            title="Submit Application"
            description="Submit your completed application for review and approval."
          />
        )}
      </div>

      <NavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={continueDisabled}
      />
    </div>
  );
};

export default StudentDetailsPage;
