import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Pagination from "../../components/ui/Pagination";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import type {
  CreateStudentParams,
  UpdateStudentParams,
} from "../../services/schoolService";
import {
  catalogService,
  CatalogInstitutionType,
  CatalogClassLevelGroup,
  AcademicSessionSummary,
  AcademicTermSummary,
} from "../../services/parentService";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  gradeLevel: string;
  tuitionAmount: number;
  createdAt?: string;
  parent?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    user?: { email?: string; phoneNumber?: string | null };
  };
}

interface SchoolProfile {
  id: string;
  schoolName: string;
  catalogSchoolId: string | null;
  [key: string]: unknown;
}

interface StudentFormState {
  firstName: string;
  lastName: string;
  institutionTypeId: string;
  gradeLevel: string;
  tuitionAmount: string;
  studentId: string;
  parentId: string;
  academicSession: string;
  termId: string;
  termName: string;
}

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100, 500];

const fmt = (n?: number | null) =>
  n != null ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 " +
  "placeholder-gray-400 outline-none transition-colors " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70";

const selectCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 " +
  "appearance-none outline-none transition-colors cursor-pointer pr-9 " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const ChevronDown: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
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
      <ChevronDown />
    </div>
  </FormField>
);

interface ModalProps {
  student?: Student | null;
  schoolProfile: SchoolProfile | null;
  onClose: () => void;
  onSave: (data: CreateStudentParams | UpdateStudentParams) => Promise<void>;
  saving: boolean;
}

const EMPTY_FORM: StudentFormState = {
  firstName: "",
  lastName: "",
  institutionTypeId: "",
  gradeLevel: "",
  tuitionAmount: "",
  studentId: "",
  parentId: "",
  academicSession: "",
  termId: "",
  termName: "",
};

const StudentModal: React.FC<ModalProps> = ({
  student,
  schoolProfile,
  onClose,
  onSave,
  saving,
}) => {
  const isEdit = !!student;
  const catalogSchoolId = schoolProfile?.catalogSchoolId ?? "";

  const [form, setForm] = useState<StudentFormState>({
    ...EMPTY_FORM,
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    gradeLevel: student?.gradeLevel ?? "",
    tuitionAmount: student?.tuitionAmount ? String(student.tuitionAmount) : "",
    studentId: student?.studentId ?? "",
    parentId: student?.parent?.id ?? "",
  });

  const [err, setErr] = useState("");
  const [institutionTypes, setInstitutionTypes] = useState<
    CatalogInstitutionType[]
  >([]);
  const [classLevelGroups, setClassLevelGroups] = useState<
    CatalogClassLevelGroup[]
  >([]);
  const [sessions, setSessions] = useState<AcademicSessionSummary[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const setF = <K extends keyof StudentFormState>(
    k: K,
    v: StudentFormState[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    setLoadingTypes(true);
    catalogService
      .getInstitutionTypes()
      .then((types) => {
        setInstitutionTypes(types);

        if (isEdit && student?.gradeLevel && catalogSchoolId) {
          (async () => {
            for (const t of types) {
              setLoadingClasses(true);
              try {
                const groups = await catalogService.getClassLevels(
                  catalogSchoolId,
                  t.id,
                );
                const match = groups
                  .flatMap((g) => g.classes)
                  .find((c) => c.name === student.gradeLevel);
                if (match) {
                  setClassLevelGroups(groups);
                  setForm((prev) => ({ ...prev, institutionTypeId: t.id }));
                  break;
                }
              } catch {
              } finally {
                setLoadingClasses(false);
              }
            }
          })();
        }
      })
      .catch(() => setInstitutionTypes([]))
      .finally(() => setLoadingTypes(false));

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
          setForm((prev) => ({
            ...prev,
            academicSession: current.sessionName,
            termId: activeTerm?.id ?? "",
            termName: activeTerm?.termName ?? "",
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  const handleInstitutionTypeChange = async (id: string) => {
    setForm((prev) => ({ ...prev, institutionTypeId: id, gradeLevel: "" }));
    setClassLevelGroups([]);
    if (!id || !catalogSchoolId) return;

    setLoadingClasses(true);
    try {
      const groups = await catalogService.getClassLevels(catalogSchoolId, id);
      setClassLevelGroups(groups);
    } catch {
      setClassLevelGroups([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const flatClasses = classLevelGroups.flatMap((g) => g.classes);
  const activeSession = sessions.find(
    (s) => s.sessionName === form.academicSession,
  );
  const availableTerms: AcademicTermSummary[] = activeSession?.terms ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErr("First name and last name are required.");
      return;
    }
    if (!form.institutionTypeId) {
      setErr("Please select an institution type.");
      return;
    }
    if (!form.gradeLevel) {
      setErr("Please select a class / level.");
      return;
    }

    try {
      if (isEdit) {
        const data: UpdateStudentParams = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gradeLevel: form.gradeLevel,
          ...(form.tuitionAmount
            ? { tuitionAmount: Number(form.tuitionAmount) }
            : {}),
          ...(form.studentId.trim()
            ? { studentId: form.studentId.trim() }
            : {}),
        };
        await onSave(data);
      } else {
        const data = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gradeLevel: form.gradeLevel,
          tuitionAmount: Number(form.tuitionAmount) || 0,
          ...(form.studentId.trim()
            ? { studentId: form.studentId.trim() }
            : {}),
        } as CreateStudentParams;
        await onSave(data);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setErr(msg ?? "An error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit Student" : "Add Student"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form
            id="student-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {err}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <input
                  required
                  value={form.firstName}
                  placeholder="e.g. Lola"
                  onChange={(e) => setF("firstName", e.target.value)}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Last Name" required>
                <input
                  required
                  value={form.lastName}
                  placeholder="e.g. Fashola"
                  onChange={(e) => setF("lastName", e.target.value)}
                  className={inputCls}
                />
              </FormField>
            </div>

            <SelectField
              label="Institution Type"
              required
              selectProps={{
                value: form.institutionTypeId,
                disabled: loadingTypes,
                onChange: (e) => handleInstitutionTypeChange(e.target.value),
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

            <FormField label="Choose School" required>
              <input
                value={schoolProfile?.schoolName ?? ""}
                disabled
                className={inputCls}
              />
            </FormField>

            <SelectField
              label="Class / Level"
              required
              selectProps={{
                value: form.gradeLevel,
                disabled: !form.institutionTypeId || loadingClasses,
                onChange: (e) => setF("gradeLevel", e.target.value),
              }}
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes…"
                  : !form.institutionTypeId
                    ? "Select a type first"
                    : flatClasses.length === 0
                      ? "No classes available"
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
                value: form.academicSession,
                disabled: loadingSessions,
                onChange: (e) =>
                  setForm((p) => ({
                    ...p,
                    academicSession: e.target.value,
                    termId: "",
                    termName: "",
                  })),
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

            <SelectField
              label="Term"
              required
              selectProps={{
                value: form.termId,
                disabled: !form.academicSession || availableTerms.length === 0,
                onChange: (e) => {
                  const t = availableTerms.find((x) => x.id === e.target.value);
                  setForm((p) => ({
                    ...p,
                    termId: e.target.value,
                    termName: t?.termName ?? "",
                  }));
                },
              }}
            >
              <option value="">
                {!form.academicSession
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
            </SelectField>

            <FormField label="Student ID / Admission No.">
              <input
                value={form.studentId}
                placeholder="e.g. STD/2025/001"
                onChange={(e) => setF("studentId", e.target.value)}
                className={inputCls}
              />
            </FormField>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? "Saving…" : isEdit ? "Update Student" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ActionMenuProps {
  student: Student;
  onEdit: () => void;
  onViewRecord: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onViewRecord }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        Actions
        <Icon
          name="chevron-down"
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 z-30 overflow-hidden py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left"
          >
            <Icon name="pencil" className="w-4 h-4 text-slate-400 shrink-0" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onViewRecord();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors text-left"
          >
            <Icon name="eye" className="w-4 h-4 text-slate-400 shrink-0" />
            View Record
          </button>
        </div>
      )}
    </div>
  );
};

const SchoolStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    schoolService
      .getProfile()
      .then((p) => setSchoolProfile(p as SchoolProfile))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (p = 1, q = search, l = limit, silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await (
          schoolService.getStudents as (
            p: number,
            l: number,
            s: string,
          ) => Promise<unknown>
        )(p, l, q);
        const d = data as {
          students?: Student[];
          pagination?: { total: number; totalPages: number; page: number };
        };
        setStudents(d.students ?? []);
        if (d.pagination) {
          setTotal(d.pagination.total);
          setTotalPages(d.pagination.totalPages);
          setPage(d.pagination.page);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [search, limit],
  );

  useEffect(() => {
    load(1, search, limit);
  }, [limit]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      load(1, val, limit);
    }, 400);
  };

  const handleSave = async (
    formData: CreateStudentParams | UpdateStudentParams,
  ) => {
    setSaving(true);
    try {
      if (editStudent) {
        await schoolService.updateStudent(
          editStudent.id,
          formData as UpdateStudentParams,
        );
      } else {
        await schoolService.createStudent(formData as CreateStudentParams);
      }
      setModalOpen(false);
      setEditStudent(null);
      load(page, search, limit, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      sidebar={
        <SchoolSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={<SchoolTopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />}
    >
      {modalOpen && (
        <StudentModal
          student={editStudent}
          schoolProfile={schoolProfile}
          onClose={() => {
            setModalOpen(false);
            setEditStudent(null);
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="pt-8 pb-12 space-y-6 w-[90%] mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Students</h1>
            <p className="text-sm text-brand mt-0.5">
              Manage all students registered under your school
            </p>
          </div>
          <button
            onClick={() => {
              setEditStudent(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#7a1848] transition-colors shrink-0"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add Student
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 shrink-0">Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 shrink-0">entries</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search name, grade, ID…"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Grade / Level
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tuition
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Icon
                          name="graduation-cap"
                          className="w-7 h-7 text-slate-300"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        No students found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchInput
                          ? "Try adjusting your search."
                          : "Students will appear here once added."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const parentName =
                      `${s.parent?.firstName ?? ""} ${s.parent?.lastName ?? ""}`.trim() ||
                      "—";
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold text-xs">
                              {(s.firstName[0] ?? "?").toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-800">
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-mono text-slate-500">
                          {s.studentId ?? "—"}
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-600">
                          {s.gradeLevel}
                        </td>
                        <td className="py-3.5 px-5 text-sm font-semibold text-slate-700">
                          {fmt(s.tuitionAmount)}
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-600">
                          {parentName}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <ActionMenu
                            student={s}
                            onEdit={() => {
                              setEditStudent(s);
                              setModalOpen(true);
                            }}
                            onViewRecord={() =>
                              navigate(`/school/students/${s.id}`)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-4 pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => load(p, search, limit)}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolStudentsPage;
