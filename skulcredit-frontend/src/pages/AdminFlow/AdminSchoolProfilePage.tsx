

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { BRAND, fmtDate, Ic } from "./components/shared";
import SchoolFormModal, { SchoolFormData } from "./components/SchoolFormModal";
import { toastSuccess, toastError } from "../../utils/toast";

interface SchoolProfile {
  id: string;
  userId: string | null;
  schoolName: string;
  contactPerson: string;
  website: string | null;
  population: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCountry: string | null;
  documentCac: string | null;
  documentLicense: string | null;
  status: "pending" | "under_review" | "approved" | "rejected";
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin: string | null;
    createdAt: string;
  } | null;
  terms: Term[];
}

interface Term {
  id: string;
  termName: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  approved:     { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Approved"     },
  pending:      { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Pending"      },
  under_review: { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Under Review" },
  rejected:     { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500",    label: "Rejected"     },
};

const StatusBadge: React.FC<{ status: string; large?: boolean }> = ({ status, large }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${c.bg} ${c.text} ${large ? "px-3.5 py-1.5 text-sm border-current/20" : "px-2.5 py-1 text-xs border-current/20"}`}>
      <span className={`rounded-full shrink-0 ${c.dot} ${large ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
      {c.label}
    </span>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value ?? <span className="text-gray-300">—</span>}</span>
  </div>
);

const Card: React.FC<{
  icon: string | string[];
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, children, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
             style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
          <Ic d={icon} cls="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

const Skeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3 py-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1">
        <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);


const DeleteModal: React.FC<{
  name: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ name, loading, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
       role="dialog" aria-modal="true"
       onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-6 h-6 text-red-500" />
        </div>
      </div>
      <h2 className="text-base font-bold text-gray-900">Delete School?</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-700">{name}</span> and all associated data will be permanently removed.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  </div>
);

const AdminSchoolProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [school,  setSchool]  = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [editOpen,   setEditOpen]   = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [delOpen,    setDelOpen]    = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [accessLoading, setAccessLoading] = useState(false);
  const [accessResult, setAccessResult] = useState<{ email: string; password: string; schoolName: string } | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);

  const fetchSchool = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: SchoolProfile }>(`/admin/schools/${id}`);
      setSchool(res.data.data);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load school");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchool(); }, [id]);

  const handleApprove = async () => {
    if (!school) return;
    setStatusLoading(true);
    try {
      await apiClient.put(`/admin/schools/${school.id}/approve`);
      toastSuccess("School approved.");
      fetchSchool();
    } catch { toastError("Failed to approve."); }
    finally { setStatusLoading(false); }
  };

  const handleReject = async () => {
    if (!school) return;
    setStatusLoading(true);
    try {
      await apiClient.put(`/admin/schools/${school.id}/reject`);
      toastSuccess("School rejected.");
      fetchSchool();
    } catch { toastError("Failed to reject."); }
    finally { setStatusLoading(false); }
  };

  const handleCreateAccess = async () => {
    if (!school) return;
    setAccessLoading(true);
    setAccessResult(null);
    setPasswordVisible(false);
    try {
      const res = await apiClient.post<{ data: { email: string; password: string; schoolName: string } }>(
        `/admin/schools/${school.id}/create-access`,
      );
      setAccessResult(res.data.data);
      fetchSchool();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Failed to create access.");
    } finally {
      setAccessLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: "email" | "password" | "both") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleEdit = async (data: SchoolFormData) => {    if (!school) return;
    setEditSaving(true);
    try {
      await apiClient.patch(`/admin/schools/${school.id}`, data);
      toastSuccess("School updated.");
      setEditOpen(false);
      fetchSchool();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Save failed.");
    } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!school) return;
    setDelLoading(true);
    try {
      await apiClient.delete(`/admin/schools/${school.id}`);
      toastSuccess("School deleted.");
      navigate("/admin/schools");
    } catch { toastError("Delete failed."); }
    finally { setDelLoading(false); }
  };

  const initials = (name: string) => {
    const parts = name.trim().split(" ");
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  };

  const fullAddress = [
    school?.addressStreet,
    school?.addressCity,
    school?.addressState,
    school?.addressCountry,
  ].filter(Boolean).join(", ");

  if (error) {
    return (
      <div className="max-w-[900px] mx-auto py-12 text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[#7A0E42] hover:underline">← Back to Schools</button>
      </div>
    );
  }

  return (
    <>
      {school && (
        <SchoolFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={{
            schoolName:        school.schoolName,
            contactPerson:     school.contactPerson,
            email:             school.user?.email ?? "",
            phoneNumber:       school.user?.phoneNumber ?? "",
            website:           school.website ?? "",
            population:        school.population ?? "",
            addressStreet:     school.addressStreet ?? "",
            addressCity:       school.addressCity ?? "",
            addressState:      school.addressState ?? "",
            bankName:          school.bankName ?? "",
            bankAccountName:   school.bankAccountName ?? "",
            bankAccountNumber: school.bankAccountNumber ?? "",
            status:            school.status,
            logoUrl:           school.logoUrl ?? "",
          }}
          onSave={handleEdit}
          saving={editSaving}
        />
      )}

      {delOpen && school && (
        <DeleteModal
          name={school.schoolName}
          loading={delLoading}
          onConfirm={handleDelete}
          onCancel={() => setDelOpen(false)}
        />
      )}

      <div className="max-w-[1000px] mx-auto py-6 sm:py-8 space-y-6">

        {/* ── Back breadcrumb ── */}
        <button
          onClick={() => navigate("/admin/schools")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#7A0E42] transition-colors"
        >
          <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />
          Back to Schools
        </button>

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Coloured header strip */}
          <div className="h-24 sm:h-28 w-full" style={{ backgroundColor: BRAND }} />

          <div className="px-5 sm:px-8 pb-6">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: "#5e0a31" }}
                >
                  {loading ? "…" : school?.logoUrl ? (
                    <img src={school.logoUrl} alt={school.schoolName} className="w-full h-full object-cover" />
                  ) : (
                    initials(school?.schoolName ?? "SC")
                  )}
                </div>
                {/* Name + status */}
                {!loading && school && (
                  <div className="pb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {school.schoolName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <StatusBadge status={school.status} large />
                      <span className="text-xs text-white/70">
                        Registered {fmtDate(school.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!loading && school && (
                <div className="flex flex-wrap items-center gap-2 pb-1 mt-4 sm:mt-0">
                  {school.status !== "approved" && (
                    <button
                      onClick={handleApprove}
                      disabled={statusLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      <Ic d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" cls="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {school.status !== "rejected" && (
                    <button
                      onClick={handleReject}
                      disabled={statusLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                    >
                      <Ic d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" cls="w-3.5 h-3.5" />
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cls="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDelOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Ic d={["M3 6h18","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats strip */}
            {!loading && school && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                {[
                  { label: "Contact Person", value: school.contactPerson },
                  { label: "Location",       value: [school.addressCity, school.addressState].filter(Boolean).join(", ") || "—" },
                  { label: "Population",     value: school.population ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* School Details */}
          <Card icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" title="School Details">
            {loading ? <Skeleton /> : school ? (
              <>
                <InfoRow label="School Name"    value={school.schoolName} />
                <InfoRow label="Contact Person" value={school.contactPerson} />
                <InfoRow label="Website"        value={school.website
                  ? <a href={school.website} target="_blank" rel="noopener noreferrer"
                       className="text-[#7A0E42] hover:underline">{school.website}</a>
                  : null} />
                <InfoRow label="Population"     value={school.population} />
                <InfoRow label="Full Address"   value={fullAddress || null} />
                <InfoRow label="City"           value={school.addressCity} />
                <InfoRow label="State"          value={school.addressState} />
                <InfoRow label="Country"        value={school.addressCountry ?? "Nigeria"} />
                <InfoRow label="Registered On"  value={fmtDate(school.createdAt)} />
                <InfoRow label="Last Updated"   value={fmtDate(school.updatedAt)} />
              </>
            ) : null}
          </Card>

          {/* Account / Contact Details */}
          <Card
            icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
            title="Account & Contact"
          >
            {loading ? <Skeleton /> : school ? (
              <>
                <InfoRow label="Email Address" value={
                  <a href={`mailto:${school.user?.email}`} className="text-[#7A0E42] hover:underline">
                    {school.user?.email}
                  </a>
                } />
                <InfoRow label="Phone Number"   value={school.user?.phoneNumber} />
                <InfoRow label="Account Status" value={
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${school.user?.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${school.user?.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {school.user?.isActive ? "Active" : "Suspended"}
                  </span>
                } />
                <InfoRow label="Email Verified" value={
                  <span className={`text-xs font-semibold ${school.user?.isEmailVerified ? "text-green-600" : "text-amber-600"}`}>
                    {school.user?.isEmailVerified ? "✓ Verified" : "✗ Not Verified"}
                  </span>
                } />
                <InfoRow label="Last Login" value={
                  school.user?.lastLogin ? fmtDate(school.user.lastLogin) : "Never"
                } />
                <InfoRow label="Account Created" value={school.user?.createdAt ? fmtDate(school.user.createdAt) : "—"} />
              </>
            ) : null}
          </Card>

          {/* Bank Account */}
          <Card
            icon="M3 9h18M3 15h18M12 3v18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
            title="Bank Account"
          >
            {loading ? <Skeleton rows={3} /> : school ? (
              school.bankAccountNumber ? (
                <>
                  <InfoRow label="Bank Name"      value={school.bankName} />
                  <InfoRow label="Account Number" value={
                    <span className="font-mono tracking-widest">{school.bankAccountNumber}</span>
                  } />
                  <InfoRow label="Account Name"   value={school.bankAccountName} />
                  <InfoRow label="Verification"   value={
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pending Verification
                    </span>
                  } />
                </>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <Ic d="M3 9h18M3 15h18" cls="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No bank account added yet.</p>
                </div>
              )
            ) : null}
          </Card>

          {/* Documents */}
          <Card
            icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"
            title="Documents"
          >
            {loading ? <Skeleton rows={2} /> : school ? (
              <>
                <InfoRow label="CAC Certificate" value={
                  school.documentCac
                    ? <a href={school.documentCac} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-[#7A0E42] hover:underline text-sm">
                        <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" cls="w-3.5 h-3.5" />
                        View Document
                      </a>
                    : <span className="text-xs text-gray-400 italic">Not uploaded</span>
                } />
                <InfoRow label="Operating License" value={
                  school.documentLicense
                    ? <a href={school.documentLicense} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-[#7A0E42] hover:underline text-sm">
                        <Ic d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" cls="w-3.5 h-3.5" />
                        View Document
                      </a>
                    : <span className="text-xs text-gray-400 italic">Not uploaded</span>
                } />
              </>
            ) : null}
          </Card>
        </div>

        {!loading && school && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                  <Ic d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" cls="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Login Access</h3>
              </div>
              <div className="flex items-center gap-2">
                {school.user?.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Access Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    No Login Access
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {school.user?.isActive
                      ? `${school.schoolName} can log in to the school portal.`
                      : `${school.schoolName} does not have login access yet.`}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {school.user?.isActive
                      ? `Last login: ${school.user?.lastLogin ? fmtDate(school.user.lastLogin) : "Never"} · Email: ${school.user?.email}`
                      : "Use the button to generate a secure password and activate this school's account. The credentials will be shown once — copy and send them to the school."}
                  </p>
                </div>
                <button
                  onClick={handleCreateAccess}
                  disabled={accessLoading}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: BRAND }}
                >
                  {accessLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Ic d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" cls="w-4 h-4" />
                  }
                  {accessLoading ? "Generating…" : school.user?.isActive ? "Reset Password" : "Create Login Access"}
                </button>
              </div>

              {accessResult && (
                <div className="rounded-2xl border border-[#7A0E42]/20 bg-[#7A0E42]/5 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Ic d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" cls="w-4 h-4 text-[#7A0E42]" />
                    <p className="text-sm font-bold text-[#7A0E42]">
                      Login credentials generated — copy and send to the school
                    </p>
                  </div>
                  <p className="text-xs text-[#7A0E42]/70 -mt-2">
                    This password is shown only once and will not be displayed again.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                        <p className="text-sm font-mono text-gray-800 truncate">{accessResult.email}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(accessResult.email, "email")}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Ic d={copied === "email" ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"} cls="w-3.5 h-3.5" />
                        {copied === "email" ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Password</p>
                        <p className="text-sm font-mono text-gray-800 tracking-widest">
                          {passwordVisible ? accessResult.password : "•".repeat(accessResult.password.length)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPasswordVisible(v => !v)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Ic d={passwordVisible
                            ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
                            : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                          } cls="w-3.5 h-3.5" />
                          {passwordVisible ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => copyToClipboard(accessResult.password, "password")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Ic d={copied === "password" ? "M9 12l2 2 4-4" : "M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"} cls="w-3.5 h-3.5" />
                          {copied === "password" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const text = `School Login Credentials\n\nSchool: ${accessResult.schoolName}\nEmail: ${accessResult.email}\nPassword: ${accessResult.password}\n\nLogin at: ${window.location.origin}/school/auth`;
                      copyToClipboard(text, "both");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#7A0E42]/30 text-sm font-semibold text-[#7A0E42] hover:bg-[#7A0E42]/5 transition-colors"
                  >
                    <Ic d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" cls="w-4 h-4" />
                    {copied === "both" ? "Copied to clipboard!" : "Copy all credentials to share"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── Terms / Academic Periods ── */}
        {school?.terms && school.terms.length > 0 && (
          <Card icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" title="Academic Terms">
            <div className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {school.terms.map(term => (
                <div key={term.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{term.termName}</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500">
                    {term.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </>
  );
};

export default AdminSchoolProfilePage;
