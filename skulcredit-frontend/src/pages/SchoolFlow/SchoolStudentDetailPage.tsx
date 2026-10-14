import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { schoolService } from "../../services/schoolService";

interface StudentDetail {
  id: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  studentId?: string | null;
  tuitionAmount?: number | string;
  createdAt?: string;
  applications?: {
    id: string;
    referenceNumber?: string | null;
    status: string;
    amountRequested?: number;
    createdAt?: string;
  }[];
  parent?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    user?: { email?: string; phoneNumber?: string | null };
  };
  school?: {
    id?: string;
    schoolName?: string;
  };
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:                  { label: "Pending",    bg: "#FFF7E6", text: "#B76E00", border: "#FFE1A8" },
  school_verification:      { label: "Pending",    bg: "#FFF7E6", text: "#B76E00", border: "#FFE1A8" },
  pending_school_approval:  { label: "Pending",    bg: "#FFF7E6", text: "#B76E00", border: "#FFE1A8" },
  under_review:             { label: "Accepted",   bg: "#EAF8F0", text: "#16794C", border: "#BCE8CF" },
  school_approved:          { label: "Accepted",   bg: "#EAF8F0", text: "#16794C", border: "#BCE8CF" },
  approved:                 { label: "Approved",   bg: "#EAF2FF", text: "#2563EB", border: "#C7DCFF" },
  disbursed:                { label: "Completed",  bg: "#E8F7F1", text: "#087F5B", border: "#B7E5D4" },
  repaid:                   { label: "Completed",  bg: "#E8F7F1", text: "#087F5B", border: "#B7E5D4" },
  rejected:                 { label: "Rejected",   bg: "#FDECEC", text: "#C62828", border: "#F5C2C2" },
  cancelled:                { label: "Cancelled",  bg: "#F1F5F9", text: "#64748B", border: "#CBD5E1" },
};

const statusStyle = (s: string) =>
  STATUS_STYLES[s] ?? { label: s.replace(/_/g, " "), bg: "#F1F5F9", text: "#64748B", border: "#CBD5E1" };

const fmt = (n?: number | string | null) =>
  n != null && n !== "" ? `₦${Number(n).toLocaleString("en-NG")}` : "—";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const SchoolStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    (schoolService.getStudent as (id: string) => Promise<unknown>)(id)
      .then((data) => {
        setStudent(data as StudentDetail);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load student";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const fullName =
    student
      ? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || "Student"
      : "Student";

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
      <div className="pt-8 pb-12 space-y-6 animate-fade-in-up w-[90%] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/school/students")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand transition-colors"
        >
          <Icon name="arrow-left" className="w-4 h-4" />
          Back to Students
        </button>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <Icon name="alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={() => navigate("/school/students")}
              className="mt-4 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              Back to Students
            </button>
          </div>
        ) : student ? (
          <>
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-brand">
                    {(student.firstName?.[0] ?? "?").toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-extrabold text-slate-900">{fullName}</h1>
                  <p className="text-sm text-brand mt-0.5">
                    {student.gradeLevel ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Student ID", value: student.studentId ?? "—" },
                { label: "Grade Level", value: student.gradeLevel ?? "—" },
                { label: "Tuition Amount", value: fmt(student.tuitionAmount) },
                {
                  label: "School",
                  value: student.school?.schoolName ?? "—",
                },
                {
                  label: "Parent",
                  value:
                    student.parent
                      ? `${student.parent.firstName ?? ""} ${student.parent.lastName ?? ""}`.trim() || "—"
                      : "—",
                },
                {
                  label: "Parent Email",
                  value: student.parent?.user?.email ?? "—",
                },
                {
                  label: "Parent Phone",
                  value: student.parent?.user?.phoneNumber ?? "—",
                },
                { label: "Enrolled On", value: fmtDate(student.createdAt) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Loan applications */}
            {student.applications && student.applications.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Loan Applications</h2>
                </div>
                <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_80px] px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <span>Reference</span>
                  <span>Status</span>
                  <span>Amount</span>
                  <span>Date</span>
                  <span />
                </div>
                <div className="divide-y divide-slate-100">
                  {student.applications.map((app) => {
                    const st = statusStyle(app.status);
                    const ref = app.referenceNumber ?? app.id.slice(0, 12).toUpperCase();
                    return (
                      <div
                        key={app.id}
                        className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_80px] items-center px-6 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-mono text-slate-600 truncate">{ref}</span>
                        <span>
                          <span
                            style={{backgroundColor: st.bg, color: st.text, borderColor: st.border}}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                          >
                            {st.label}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{fmt(app.amountRequested)}</span>
                        <span className="text-sm text-slate-500">{fmtDate(app.createdAt)}</span>
                        <div className="flex justify-end">
                          <button
                            onClick={() => navigate(`/school/applications/${app.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand/30 text-brand text-xs font-semibold hover:bg-brand/5 transition-colors"
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default SchoolStudentDetailPage;
