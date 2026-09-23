import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import {
  catalogService,
  CatalogInstitutionType,
  CatalogSchool,
  CatalogClassLevelGroup,
  AcademicSessionSummary,
  AcademicTermSummary,
} from "../../services/parentService";
import { resolveUploadUrl } from "../../utils/uploadUrl";

interface ParentProfile {
  firstName: string;
  lastName: string;
  middleName: string | null;
  dob: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressLga: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  profilePhotoUrl: string | null;
  kycStatus: string;
  bvn: string | null;
  nin: string | null;
  user: {
    email: string;
    phoneNumber: string | null;
    isEmailVerified: boolean;
    lastLogin: string | null;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  gradeLevel: string;
  tuitionAmount: number;
  schoolId: string;
  school?: {
    id: string;
    name: string;
  };
  createdAt?: string;
}

interface PersonalFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  dob: string;
  addressStreet: string;
  addressCity: string;
  addressLga: string;
  addressState: string;
  addressCountry: string;
}

interface EmploymentFormData {
  employmentStatus: string;
  employer: string;
  monthlyIncome: string;
}

interface StudentFormData {
  firstName: string;
  lastName: string;
  institutionTypeId: string;
  institutionTypeName: string;
  schoolId: string;
  schoolName: string;
  gradeLevel: string;
  tuitionAmount: string;
  studentId: string;
  academicSession: string; // e.g. "2026/2027"
  termId: string; 
  termName: string; 
}

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-8 h-8"}
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-3.5 h-3.5"}
    aria-hidden="true"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-3.5 h-3.5"}
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-3.5 h-3.5"}
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GradCapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-5 h-5"}
    aria-hidden="true"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-5 h-5"}
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
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

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 " +
  "placeholder-gray-400 outline-none transition-colors " +
  "focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20";

const selectCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 " +
  "appearance-none outline-none transition-colors cursor-pointer pr-9 " +
  "focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const FieldRow: React.FC<{
  label: string;
  value: string | null | undefined;
}> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm font-medium text-gray-800">
      {value && value.trim() ? value : "—"}
    </span>
  </div>
);

const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const SelectField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
}> = ({ label, required, children, selectProps }) => (
  <FormField label={label} required={required}>
    <div className="relative">
      <select className={selectCls} {...selectProps}>
        {children}
      </select>
      <ChevronDownIcon />
    </div>
  </FormField>
);

function maskSensitive(val: string | null | undefined): string {
  if (!val) return "—";
  if (val.length <= 3) return "•".repeat(val.length);
  return "•".repeat(val.length - 2) + val.slice(-2);
}

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? "h-4 w-4"}`}
  />
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, onClose, children, footer }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
    role="dialog"
    aria-modal="true"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const ConfirmModal: React.FC<{
  message: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, loading, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-8 text-center shadow-xl">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <TrashIcon className="w-5 h-5 text-red-500" />
        </div>
      </div>
      <h2 className="text-base font-bold text-gray-800">Are you sure?</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-full bg-[#8B1C53] py-2.5 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Spinner className="h-3.5 w-3.5" />}
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  </div>
);

const Toast: React.FC<{ message: string; type: "success" | "error" }> = ({
  message,
  type,
}) => (
  <div
    className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
  >
    {message}
  </div>
);

const ModalFooter: React.FC<{
  saving: boolean;
  onCancel: () => void;
  saveLabel?: string;
  formId: string;
}> = ({ saving, onCancel, saveLabel = "Save Changes", formId }) => (
  <>
    <button
      type="button"
      onClick={onCancel}
      className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      form={formId}
      disabled={saving}
      className="flex items-center gap-2 rounded-full bg-[#8B1C53] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
    >
      {saving && <Spinner className="h-3.5 w-3.5" />}
      {saving ? "Saving…" : saveLabel}
    </button>
  </>
);

const EditButton: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = "Edit",
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1.5 rounded-lg border border-[#e8a0bf] bg-[#fdf0f6] px-3 py-1.5 text-xs font-semibold text-[#8B1C53] hover:bg-[#fce4f0] transition-colors shrink-0"
  >
    <PencilIcon className="w-3 h-3" />
    {label}
  </button>
);

const SkeletonRows: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1">
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const ParentSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [institutionTypes, setInstitutionTypes] = useState<
    CatalogInstitutionType[]
  >([]);
  const [catalogSchools, setCatalogSchools] = useState<CatalogSchool[]>([]);
  const [classLevelGroups, setClassLevelGroups] = useState<
    CatalogClassLevelGroup[]
  >([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [sessions, setSessions] = useState<AcademicSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] =
    useState(false);

  const [personalForm, setPersonalForm] = useState<PersonalFormData>({
    firstName: "",
    lastName: "",
    middleName: "",
    dob: "",
    addressStreet: "",
    addressCity: "",
    addressLga: "",
    addressState: "",
    addressCountry: "",
  });

  const [employmentForm, setEmploymentForm] = useState<EmploymentFormData>({
    employmentStatus: "",
    employer: "",
    monthlyIncome: "",
  });
  const [savedEmployment, setSavedEmployment] = useState<EmploymentFormData>({
    employmentStatus: "",
    employer: "",
    monthlyIncome: "",
  });

  const [studentForm, setStudentForm] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    institutionTypeId: "",
    institutionTypeName: "",
    schoolId: "",
    schoolName: "",
    gradeLevel: "",
    tuitionAmount: "",
    studentId: "",
    academicSession: "",
    termId: "",
    termName: "",
  });

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [deletingStudentLoading, setDeletingStudentLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.firstName
      ? `${user.firstName} ${user.lastName ?? ""}`.trim()
      : (user?.email?.split("@")[0] ?? "—");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const email = profile?.user?.email ?? user?.email ?? "—";
  const phone = profile?.user?.phoneNumber ?? user?.phoneNumber ?? "—";
  const photoUrl = profile?.profilePhotoUrl ?? null;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await apiClient.get<{ data: ParentProfile }>(
          "/parents/profile",
        );
        const p = res.data.data;
        setProfile(p);
        setPersonalForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          middleName: p.middleName ?? "",
          dob: p.dob ?? "",
          addressStreet: p.addressStreet ?? "",
          addressCity: p.addressCity ?? "",
          addressLga: p.addressLga ?? "",
          addressState: p.addressState ?? "",
          addressCountry: p.addressCountry ?? "",
        });
      } catch {
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await apiClient.get<{ data: Student[] }>(
          "/parents/students",
        );
        setStudents(res.data.data ?? []);
      } catch {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    const fetchInstitutionTypes = async () => {
      setLoadingTypes(true);
      try {
        const types = await catalogService.getInstitutionTypes();
        setInstitutionTypes(types);
      } catch {
        setInstitutionTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProfile();
    fetchStudents();
    fetchInstitutionTypes();
  }, []);

  const handleInstitutionTypeChange = async (id: string, name: string) => {
    setStudentForm((p) => ({
      ...p,
      institutionTypeId: id,
      institutionTypeName: name,
      schoolId: "",
      schoolName: "",
      gradeLevel: "",
    }));
    setCatalogSchools([]);
    setClassLevelGroups([]);
    if (!id) return;

    setLoadingSchools(true);
    try {
      const schools = await catalogService.getSchools(id);
      setCatalogSchools(schools);
    } catch {
      setCatalogSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolChange = async (id: string, name: string) => {
    setStudentForm((p) => ({
      ...p,
      schoolId: id,
      schoolName: name,
      gradeLevel: "",
    }));
    setClassLevelGroups([]);
    if (!id || !studentForm.institutionTypeId) return;

    setLoadingClasses(true);
    try {
      const groups = await catalogService.getClassLevels(
        id,
        studentForm.institutionTypeId,
      );
      setClassLevelGroups(groups);
    } catch {
      setClassLevelGroups([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const flatClasses = classLevelGroups.flatMap((g) => g.classes);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be smaller than 5 MB.");
      return;
    }
    setPhotoError("");
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await apiClient.post<{ data: { url: string } }>(
        "/upload/document",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const url = uploadRes.data.data.url;
      await apiClient.put("/parents/profile/photo", { profilePhotoUrl: url });
      setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: url } : prev));
      showToast("Profile photo updated.", "success");
    } catch {
      setPhotoError("Photo upload failed. Please try again.");
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const payload: Record<string, string | undefined> = {
        addressStreet: personalForm.addressStreet || undefined,
        addressCity: personalForm.addressCity || undefined,
        addressLga: personalForm.addressLga || undefined,
        addressState: personalForm.addressState || undefined,
        addressCountry: personalForm.addressCountry || undefined,
      };
      if (personalForm.dob) payload.dob = personalForm.dob;
      if (personalForm.middleName) payload.middleName = personalForm.middleName;

      const res = await apiClient.put<{ data: ParentProfile }>(
        "/parents/profile",
        payload,
      );
      setProfile(res.data.data);
      setShowPersonalModal(false);
      showToast("Personal information updated.", "success");
    } catch {
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveEmployment = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedEmployment({ ...employmentForm });
    setShowEmploymentModal(false);
    showToast("Employment information updated.", "success");
  };

  const openEmploymentModal = () => {
    setEmploymentForm({ ...savedEmployment });
    setShowEmploymentModal(true);
  };

  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      firstName: "",
      lastName: "",
      institutionTypeId: "",
      institutionTypeName: "",
      schoolId: "",
      schoolName: "",
      gradeLevel: "",
      tuitionAmount: "",
      studentId: "",
      academicSession: "",
      termId: "",
      termName: "",
    });
    setCatalogSchools([]);
    setClassLevelGroups([]);
    setShowStudentModal(true);
    if (!sessions.length) {
      setLoadingSessions(true);
      catalogService
        .getSessions()
        .then((data) => {
          setSessions(data);
          const current = data.find((s) => s.isCurrent);
          if (current) {
            const activeTerm = current.terms.find(
              (t) => t.status === "ACTIVE_APPLICATION",
            );
            setStudentForm((prev) => ({
              ...prev,
              academicSession: current.sessionName,
              termId: activeTerm?.id ?? "",
              termName: activeTerm?.termName ?? "",
            }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSessions(false));
    }
  };

  const openEditStudent = async (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      firstName: s.firstName,
      lastName: s.lastName,
      institutionTypeId: "",
      institutionTypeName: "",
      schoolId: s.schoolId,
      schoolName: s.school?.name ?? "",
      gradeLevel: s.gradeLevel,
      tuitionAmount: String(s.tuitionAmount),
      studentId: s.studentId ?? "",
      academicSession: "",
      termId: "",
      termName: "",
    });
    setCatalogSchools([]);
    setClassLevelGroups([]);
    setShowStudentModal(true);

    if (!sessions.length) {
      setLoadingSessions(true);
      catalogService
        .getSessions()
        .then((data) => {
          setSessions(data);
          const current = data.find((d) => d.isCurrent);
          if (current) {
            const activeTerm = current.terms.find(
              (t) => t.status === "ACTIVE_APPLICATION",
            );
            setStudentForm((prev) => ({
              ...prev,
              academicSession: current.sessionName,
              termId: activeTerm?.id ?? "",
              termName: activeTerm?.termName ?? "",
            }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSessions(false));
    }

    if (!s.schoolId) return;
    try {
      const types = institutionTypes.length
        ? institutionTypes
        : await catalogService
            .getInstitutionTypes()
            .catch(() => [] as typeof institutionTypes);
      if (!institutionTypes.length && types.length) setInstitutionTypes(types);

      let matchedTypeId = "";
      let matchedTypeName = "";
      let matchedSchools: typeof catalogSchools = [];

      for (const t of types) {
        setLoadingSchools(true);
        const schools = await catalogService
          .getSchools(t.id)
          .catch(() => [] as typeof catalogSchools);
        const found = schools.find((sc) => sc.id === s.schoolId);
        if (found) {
          matchedTypeId = t.id;
          matchedTypeName = t.name;
          matchedSchools = schools;
          break;
        }
      }
      setLoadingSchools(false);

      if (!matchedTypeId) return;

      setCatalogSchools(matchedSchools);
      setStudentForm((prev) => ({
        ...prev,
        institutionTypeId: matchedTypeId,
        institutionTypeName: matchedTypeName,
      }));

      setLoadingClasses(true);
      const groups = await catalogService
        .getClassLevels(s.schoolId, matchedTypeId)
        .catch(() => [] as typeof classLevelGroups);
      setLoadingClasses(false);
      setClassLevelGroups(groups);
    } catch {
      setLoadingSchools(false);
      setLoadingClasses(false);
    }
  };
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);
    try {
      const payload = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        schoolId: studentForm.schoolId,
        gradeLevel: studentForm.gradeLevel,
        tuitionAmount: parseFloat(studentForm.tuitionAmount) || 0,
        studentId: studentForm.studentId || undefined,
      };

      if (editingStudent) {
        const res = await apiClient.put<{ data: Student }>(
          `/parents/students/${editingStudent.id}`,
          payload,
        );
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? res.data.data : s)),
        );
        showToast("Student updated successfully.", "success");
      } else {
        const res = await apiClient.post<{ data: Student }>(
          "/parents/students",
          payload,
        );
        setStudents((prev) => [...prev, res.data.data]);
        showToast("Student added successfully.", "success");
      }
      setShowStudentModal(false);
    } catch {
      showToast("Failed to save student. Please try again.", "error");
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeletingStudentLoading(true);
    try {
      await apiClient.delete(`/parents/students/${deletingStudent.id}`);
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      setShowDeleteStudentConfirm(false);
      setDeletingStudent(null);
      showToast("Student removed.", "success");
    } catch {
      showToast("Failed to delete student.", "error");
    } finally {
      setDeletingStudentLoading(false);
    }
  };

  const EMPLOYMENT_OPTIONS = [
    { value: "employed_full", label: "Employed (Full-time)" },
    { value: "employed_part", label: "Employed (Part-time)" },
    { value: "employed_govt", label: "Employed (Government)" },
    { value: "self_employed", label: "Self-Employed" },
    { value: "business_owner", label: "Business Owner" },
    { value: "freelancer", label: "Freelancer" },
    { value: "unemployed", label: "Unemployed" },
  ];

  const employmentLabel = (val: string) =>
    EMPLOYMENT_OPTIONS.find((o) => o.value === val)?.label ?? val;

  const fmtIncome = (val: string) => {
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num)) return val;
    return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 0 });
  };

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {showPersonalModal && (
        <Modal
          title="Edit Personal Information"
          onClose={() => setShowPersonalModal(false)}
          footer={
            <ModalFooter
              saving={savingPersonal}
              onCancel={() => setShowPersonalModal(false)}
              formId="personal-form"
            />
          }
        >
          <form
            id="personal-form"
            onSubmit={handleSavePersonal}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name">
                <input
                  value={personalForm.firstName}
                  readOnly
                  className={inputCls + " bg-gray-50 cursor-not-allowed"}
                />
              </FormField>
              <FormField label="Last Name">
                <input
                  value={personalForm.lastName}
                  readOnly
                  className={inputCls + " bg-gray-50 cursor-not-allowed"}
                />
              </FormField>
            </div>
            <FormField label="Middle Name">
              <input
                value={personalForm.middleName}
                placeholder="Middle name (optional)"
                onChange={(e) =>
                  setPersonalForm((p) => ({ ...p, middleName: e.target.value }))
                }
                className={inputCls}
              />
            </FormField>
            <FormField label="Date of Birth">
              <input
                type="date"
                value={personalForm.dob}
                onChange={(e) =>
                  setPersonalForm((p) => ({ ...p, dob: e.target.value }))
                }
                className={inputCls}
              />
            </FormField>
            <FormField label="Home Address">
              <input
                value={personalForm.addressStreet}
                placeholder="e.g. 12 Adeola Street, Ikeja"
                onChange={(e) =>
                  setPersonalForm((p) => ({
                    ...p,
                    addressStreet: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="City">
                <input
                  value={personalForm.addressCity}
                  placeholder="e.g. Ikeja"
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      addressCity: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </FormField>
              <FormField label="LGA">
                <input
                  value={personalForm.addressLga}
                  placeholder="e.g. Ikeja"
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      addressLga: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="State">
                <input
                  value={personalForm.addressState}
                  placeholder="e.g. Lagos State"
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      addressState: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </FormField>
              <FormField label="Country">
                <input
                  value={personalForm.addressCountry}
                  placeholder="e.g. Nigeria"
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      addressCountry: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </FormField>
            </div>
          </form>
        </Modal>
      )}

      {showEmploymentModal && (
        <Modal
          title="Edit Employment Information"
          onClose={() => setShowEmploymentModal(false)}
          footer={
            <ModalFooter
              saving={false}
              onCancel={() => setShowEmploymentModal(false)}
              formId="employment-form"
            />
          }
        >
          <form
            id="employment-form"
            onSubmit={handleSaveEmployment}
            className="flex flex-col gap-4"
          >
            <SelectField
              label="Employment Status"
              required
              selectProps={{
                value: employmentForm.employmentStatus,
                onChange: (e) =>
                  setEmploymentForm((p) => ({
                    ...p,
                    employmentStatus: e.target.value,
                  })),
              }}
            >
              <option value="">Select status</option>
              {EMPLOYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
            <FormField label="Employer / Company">
              <input
                value={employmentForm.employer}
                placeholder="e.g. Zenith Logistics Ltd"
                onChange={(e) =>
                  setEmploymentForm((p) => ({ ...p, employer: e.target.value }))
                }
                className={inputCls}
              />
            </FormField>
            <FormField label="Monthly Income (₦)">
              <input
                value={employmentForm.monthlyIncome}
                placeholder="e.g. 450,000"
                inputMode="numeric"
                onChange={(e) =>
                  setEmploymentForm((p) => ({
                    ...p,
                    monthlyIncome: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </FormField>
            <p className="text-xs text-gray-400 leading-relaxed rounded-xl bg-[#fdf0f6] border border-[#f5c6d8] px-4 py-3 text-[#8B1C53]">
              Employment details here are for your reference. Your full
              employment info is collected during the loan application process.
            </p>
          </form>
        </Modal>
      )}

      {showStudentModal && (
        <Modal
          title={editingStudent ? "Edit Student" : "Add Student"}
          onClose={() => setShowStudentModal(false)}
          footer={
            <ModalFooter
              saving={savingStudent}
              onCancel={() => setShowStudentModal(false)}
              formId="student-form"
              saveLabel={editingStudent ? "Update Student" : "Add Student"}
            />
          }
        >
          <form
            id="student-form"
            onSubmit={handleSaveStudent}
            className="flex flex-col gap-4"
          >
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <input
                  required
                  value={studentForm.firstName}
                  placeholder="e.g. Lola"
                  onChange={(e) =>
                    setStudentForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className={inputCls}
                />
              </FormField>
              <FormField label="Last Name" required>
                <input
                  required
                  value={studentForm.lastName}
                  placeholder="e.g. Fashola"
                  onChange={(e) =>
                    setStudentForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className={inputCls}
                />
              </FormField>
            </div>
            <SelectField
              label="Institution Type"
              required
              selectProps={{
                value: studentForm.institutionTypeId,
                disabled: loadingTypes,
                onChange: (e) => {
                  const opt = institutionTypes.find(
                    (t) => t.id === e.target.value,
                  );
                  handleInstitutionTypeChange(e.target.value, opt?.name ?? "");
                },
              }}
            >
              <option value="">
                {loadingTypes ? "Loading types…" : "— Select type —"}
              </option>
              {institutionTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Choose School"
              required
              selectProps={{
                value: studentForm.schoolId,
                disabled: !studentForm.institutionTypeId || loadingSchools,
                onChange: (e) => {
                  const opt = catalogSchools.find(
                    (s) => s.id === e.target.value,
                  );
                  handleSchoolChange(e.target.value, opt?.name ?? "");
                },
              }}
            >
              <option value="">
                {loadingSchools
                  ? "Loading schools…"
                  : !studentForm.institutionTypeId
                    ? "Select a type first"
                    : "— Choose School —"}
              </option>
              {catalogSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Class / Level"
              required
              selectProps={{
                value: studentForm.gradeLevel,
                disabled: !studentForm.schoolId || loadingClasses,
                onChange: (e) =>
                  setStudentForm((p) => ({ ...p, gradeLevel: e.target.value })),
              }}
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes…"
                  : !studentForm.schoolId
                    ? "Select a school first"
                    : "— Choose Class —"}
              </option>
              {flatClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Academic Session"
              required
              selectProps={{
                value: studentForm.academicSession,
                disabled: loadingSessions,
                onChange: (e) => {
                  setStudentForm((p) => ({
                    ...p,
                    academicSession: e.target.value,
                    termId: "",
                    termName: "",
                  }));
                },
              }}
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
            </SelectField>
            {(() => {
              const activeSession = sessions.find(
                (s) => s.sessionName === studentForm.academicSession,
              );
              const availableTerms: AcademicTermSummary[] =
                activeSession?.terms ?? [];
              return (
                <SelectField
                  label="Term"
                  required
                  selectProps={{
                    value: studentForm.termId,
                    disabled:
                      !studentForm.academicSession ||
                      availableTerms.length === 0,
                    onChange: (e) => {
                      const t = availableTerms.find(
                        (x) => x.id === e.target.value,
                      );
                      setStudentForm((p) => ({
                        ...p,
                        termId: e.target.value,
                        termName: t?.termName ?? "",
                      }));
                    },
                  }}
                >
                  <option value="">
                    {!studentForm.academicSession
                      ? "Select a session first"
                      : "— Select term —"}
                  </option>
                  {availableTerms.map((t) => {
                    const isOpen = t.status === "ACTIVE_APPLICATION";
                    const isClosed =
                      t.status === "APPLICATION_CLOSED" ||
                      t.status === "COMPLETED";
                    return (
                      <option key={t.id} value={t.id} disabled={isClosed}>
                        {t.termName}
                        {isOpen ? " ✓ Open" : isClosed ? " (Closed)" : ""}
                      </option>
                    );
                  })}
                </SelectField>
              );
            })()}

            {/* Student ID */}
            <FormField label="Student ID / Admission No.">
              <input
                value={studentForm.studentId}
                placeholder="e.g. STD/2025/001"
                onChange={(e) =>
                  setStudentForm((p) => ({ ...p, studentId: e.target.value }))
                }
                className={inputCls}
              />
            </FormField>

            <p className="text-xs text-gray-400 leading-relaxed">
              Saved students are reused when you start a new school fee
              application.
            </p>
          </form>
        </Modal>
      )}

      {showDeleteStudentConfirm && deletingStudent && (
        <ConfirmModal
          message={`Remove ${deletingStudent.firstName} ${deletingStudent.lastName} from your saved students? This won't affect existing applications.`}
          loading={deletingStudentLoading}
          onConfirm={handleDeleteStudent}
          onCancel={() => {
            setShowDeleteStudentConfirm(false);
            setDeletingStudent(null);
          }}
        />
      )}

      <div className="flex flex-col gap-6 py-8 pb-16 w-full">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-[#8B1C53]">My Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your personal information and settings
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden bg-[#8B1C53] shadow-sm">
          <div className="px-6 py-6 flex flex-wrap items-center gap-4">
            {/* Avatar / Photo */}
            <div className="relative shrink-0 group">
              {photoUrl ? (
                <img
                  src={resolveUploadUrl(photoUrl)}
                  alt="Profile photo"
                  className="h-16 w-16 rounded-full object-cover border-2 border-white/40"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}

              <div
                className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/30"
                style={{ display: photoUrl ? "none" : "flex" }}
                aria-hidden={!!photoUrl}
              >
                <UserIcon className="w-8 h-8" />
              </div>

              {photoLoading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Spinner className="h-5 w-5 border-white" />
                </div>
              )}
              {!photoLoading && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change profile photo"
                >
                  <PencilIcon className="w-4 h-4 text-white" />
                </button>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
                aria-label="Upload profile photo"
              />
            </div>

            {/* Name + info */}
            <div className="text-white flex-1 min-w-0">
              {loadingProfile ? (
                <>
                  <div className="h-5 w-36 bg-white/20 rounded animate-pulse mb-1.5" />
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-base font-bold truncate">{fullName}</p>
                  <p className="text-xs text-white/70 mt-0.5">Parent Account</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    Member since {memberSince}
                  </p>
                </>
              )}
              {photoError && (
                <p className="text-xs text-red-300 mt-1">{photoError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-sm font-bold text-[#8B1C53]">
              Personal Information
            </h2>
            <EditButton onClick={() => setShowPersonalModal(true)} />
          </div>

          <div className="px-6 pb-6">
            {loadingProfile ? (
              <SkeletonRows count={8} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldRow label="Full Name" value={fullName} />
                <FieldRow label="Email Address" value={email} />
                <FieldRow label="Phone Number" value={phone} />
                <FieldRow label="Home Address" value={profile?.addressStreet} />
                <FieldRow label="City" value={profile?.addressCity} />
                <FieldRow label="State" value={profile?.addressState} />
                <FieldRow
                  label="BVN/NIN"
                  value={maskSensitive(profile?.bvn ?? profile?.nin)}
                />
                <FieldRow
                  label="Date of Birth"
                  value={profile?.dob ?? undefined}
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-sm font-bold text-[#8B1C53]">
              Employment Information
            </h2>
            <EditButton onClick={openEmploymentModal} />
          </div>

          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldRow
                label="Employment Status"
                value={
                  savedEmployment.employmentStatus
                    ? employmentLabel(savedEmployment.employmentStatus)
                    : null
                }
              />
              <FieldRow
                label="Employer / Company"
                value={savedEmployment.employer || null}
              />
              <FieldRow
                label="Monthly Income (NGN)"
                value={
                  savedEmployment.monthlyIncome
                    ? fmtIncome(savedEmployment.monthlyIncome)
                    : null
                }
              />
            </div>
          </div>

          {!savedEmployment.employmentStatus && (
            <div className="mx-6 mb-5 rounded-xl bg-[#fdf0f6] border border-[#f5c6d8] px-4 py-3">
              <p className="text-xs text-[#8B1C53] leading-relaxed">
                Click <strong>Edit</strong> to add your employment details. Full
                employment info is also collected during the loan application
                process.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#8B1C53]">My Students</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved students are reused when you start a new school fee
                application.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddStudent}
              className="flex items-center gap-1.5 rounded-lg bg-[#8B1C53] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7a1848] transition-colors shrink-0"
            >
              <PlusIcon className="w-3 h-3" />
              Add Student
            </button>
          </div>

          <div className="px-6 pb-5 flex flex-col gap-3">
            {loadingStudents ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <GradCapIcon className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No students added yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Add Student" to get started
                </p>
              </div>
            ) : (
              students.map((student) => {
                const schoolLabel = [student.school?.name]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 hover:border-[#e8a0bf] hover:bg-[#fdf8fb] transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#f5e8f0] flex items-center justify-center shrink-0">
                      <GradCapIcon className="w-5 h-5 text-[#8B1C53]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#8B1C53] truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {[schoolLabel, student.gradeLevel]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditStudent(student)}
                        aria-label="Edit student"
                        className="rounded-lg p-2 text-gray-400 hover:bg-[#f5e8f0] hover:text-[#8B1C53] transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingStudent(student);
                          setShowDeleteStudentConfirm(true);
                        }}
                        aria-label="Delete student"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentSettingsPage;
