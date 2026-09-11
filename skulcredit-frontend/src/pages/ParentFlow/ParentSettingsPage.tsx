import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
    xmlns="http://www.w3.org/2000/svg"
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
    xmlns="http://www.w3.org/2000/svg"
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

const PinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? "w-4 h-4"}
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8B1C53"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ── Shared styles ───────

const inputCls =
  "w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 " +
  "placeholder-gray-400 outline-none transition-colors " +
  "focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20 focus:bg-white";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

// ── Delete photo confirmation modal ────────────────

const DeletePhotoModal: React.FC<{
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isDeleting, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-photo-title"
  >
    <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-8 text-center shadow-xl">
      <div className="flex justify-center mb-4">
        <WarningIcon />
      </div>
      <h2 id="delete-photo-title" className="text-base font-bold text-gray-800">
        Delete Profile Photo?
      </h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        Your profile photo will be permanently removed. Your avatar will revert
        to the default icon.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 rounded-full bg-[#8B1C53] py-2.5 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
        >
          {isDeleting ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ── SecurityRow ─────────

const SecurityRow: React.FC<{
  label: string;
  detail: string;
  action: string;
  onAction: () => void;
}> = ({ label, detail, action, onAction }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
    </div>
    <button
      type="button"
      onClick={onAction}
      className="shrink-0 rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:border-[#8B1C53] hover:text-[#8B1C53] transition-colors focus:outline-none"
    >
      {action}
    </button>
  </div>
);

// ── Profile form state ──

interface ProfileState {
  fullName: string;
  email: string;
  phone: string;
  homeAddress: string;
  city: string;
  state: string;
  bvnNin: string;
  employmentStatus: string;
  employer: string;
  monthlyIncome: string;
  studentFullName: string;
  schoolName: string;
  schoolLocation: string;
  sessionTerm: string;
}

// ── Page ────────────────

const ParentSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : (user?.name ?? user?.email?.split("@")[0] ?? "—");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const [profile, setProfile] = useState<ProfileState>({
    fullName,
    email: user?.email ?? "",
    phone: user?.phoneNumber ?? "",
    homeAddress: "",
    city: "",
    state: "",
    bvnNin: "",
    employmentStatus: "",
    employer: "",
    monthlyIncome: "",
    studentFullName: "",
    schoolName: user?.schoolName ?? "",
    schoolLocation: "",
    sessionTerm: "",
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const set =
    (field: keyof ProfileState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Photo upload ────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file (JPG, PNG, etc.).");
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
      const res = await apiClient.post<{ data: { url: string } }>(
        "/upload/document",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const url = res.data.data.url;
      await apiClient.put("/parents/profile/photo", { profilePhotoUrl: url });
      setPhotoUrl(url);
    } catch {
      setPhotoError("Photo upload failed. Please try again.");
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // ── Photo delete ────

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete("/parents/profile/photo");
      setPhotoUrl(null);
      setShowDeleteModal(false);
    } catch {
      setPhotoError("Failed to delete photo.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Profile save ────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.put("/parents/profile", {
        addressStreet: profile.homeAddress || undefined,
        addressCity: profile.city || undefined,
        addressState: profile.state || undefined,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      /* errors surfaced via toast in a future iteration */
    } finally {
      setIsSaving(false);
    }
  };

  const readOnly = !isEditing;

  return (
    <>
      {showDeleteModal && (
        <DeletePhotoModal
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="flex flex-col gap-6 mt-8 w-[90%] mx-auto pb-12 animate-fade-in-up">
        {/* ── Page header ───────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your personal information and account settings
            </p>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                form="settings-form"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-[#8B1C53] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
              >
                <PencilIcon />
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#8B1C53] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7a1848] transition-colors"
            >
              <PencilIcon />
              Edit Profile
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 font-medium">
            Profile saved successfully.
          </div>
        )}

        {/* ── Profile card ──────────── */}
        <div className="rounded-2xl border border-[#8B1C53]/30 bg-white overflow-hidden">
          {/* Banner */}
          <div className="bg-[#8B1C53] px-6 py-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile photo"
                    className="h-16 w-16 rounded-full object-cover border-2 border-white/40"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
                    <UserIcon className="w-8 h-8" />
                  </div>
                )}
                {photoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="text-white flex-1 min-w-0">
                <p className="text-base font-bold truncate">
                  {profile.fullName || "—"}
                </p>
                <p className="text-xs text-white/70 mt-0.5">Parent Account</p>
                <p className="text-xs text-white/60 mt-0.5">
                  Member since {memberSince}
                </p>
                {photoError && (
                  <p className="mt-1 text-xs text-red-300">{photoError}</p>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
                aria-label="Upload profile photo"
              />

              {/* Photo actions */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  disabled={photoLoading}
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <PencilIcon className="w-3 h-3" />
                  Edit Photo
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                >
                  <TrashIcon className="w-3 h-3" />
                  Delete Photo
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            id="settings-form"
            onSubmit={handleSave}
            className="px-6 py-6 flex flex-col gap-8"
          >
            {/* ── Personal Information ── */}
            <section>
              <h2 className="text-sm font-bold text-[#8B1C53] mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name *">
                  <input
                    value={profile.fullName}
                    onChange={set("fullName")}
                    readOnly={readOnly}
                    placeholder="First Last"
                    className={inputCls}
                  />
                </Field>
                <Field label="Email Address *">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={set("email")}
                    readOnly={readOnly}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone Number *">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={set("phone")}
                    readOnly={readOnly}
                    placeholder="+234 800 000 0000"
                    className={inputCls}
                  />
                </Field>
                <Field label="Home Address">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <PinIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      value={profile.homeAddress}
                      onChange={set("homeAddress")}
                      readOnly={readOnly}
                      placeholder="12 Example Street"
                      className={inputCls + " pl-9"}
                    />
                  </div>
                </Field>
                <Field label="City">
                  <input
                    value={profile.city}
                    onChange={set("city")}
                    readOnly={readOnly}
                    placeholder="e.g Ikeja"
                    className={inputCls}
                  />
                </Field>
                <Field label="State">
                  <input
                    value={profile.state}
                    onChange={set("state")}
                    readOnly={readOnly}
                    placeholder="e.g Lagos State"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="BVN / NIN">
                  <input
                    value={profile.bvnNin}
                    onChange={set("bvnNin")}
                    readOnly={readOnly}
                    placeholder="Enter your BVN or NIN"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Employment Information ── */}
            <section>
              <h2 className="text-sm font-bold text-[#8B1C53] mb-4">
                Employment Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Employment Status">
                  <select
                    value={profile.employmentStatus}
                    onChange={set("employmentStatus")}
                    disabled={readOnly}
                    className={inputCls + " appearance-none"}
                  >
                    <option value="">Select type</option>
                    <option value="employed_private">Employed (Private)</option>
                    <option value="employed_govt">Employed (Government)</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </Field>
                <Field label="Employer / Company">
                  <input
                    value={profile.employer}
                    onChange={set("employer")}
                    readOnly={readOnly}
                    placeholder="Company name"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Monthly Income (₦)">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={profile.monthlyIncome}
                    onChange={set("monthlyIncome")}
                    readOnly={readOnly}
                    placeholder="e.g 250,000"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Student Information ── */}
            <section>
              <h2 className="text-sm font-bold text-[#8B1C53] mb-4">
                Student Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Student Full Name">
                  <input
                    value={profile.studentFullName}
                    onChange={set("studentFullName")}
                    readOnly={readOnly}
                    placeholder="Student name"
                    className={inputCls}
                  />
                </Field>
                <Field label="School Name">
                  <input
                    value={profile.schoolName}
                    onChange={set("schoolName")}
                    readOnly={readOnly}
                    placeholder="School name"
                    className={inputCls}
                  />
                </Field>
                <Field label="School Location">
                  <input
                    value={profile.schoolLocation}
                    onChange={set("schoolLocation")}
                    readOnly={readOnly}
                    placeholder="e.g Lagos"
                    className={inputCls}
                  />
                </Field>
                <Field label="Session / Term">
                  <input
                    value={profile.sessionTerm}
                    onChange={set("sessionTerm")}
                    readOnly={readOnly}
                    placeholder="e.g 2025/2026 First Term"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>
          </form>
        </div>

        {/* ── Security & Privacy ──────── */}
        <div className="rounded-2xl border border-[#8B1C53]/30 bg-white px-6 py-6">
          <h2 className="text-sm font-bold text-[#8B1C53] mb-4">
            Security &amp; Privacy
          </h2>
          <div className="flex flex-col divide-y divide-gray-100">
            <SecurityRow
              label="Password"
              detail="Last changed 30 days ago"
              action="Change Password"
              onAction={() => {}}
            />
            <SecurityRow
              label="Two-Factor Authentication"
              detail="Add an extra layer of security to your account"
              action="Enable"
              onAction={() => {}}
            />
            <SecurityRow
              label="Email Notifications"
              detail="Receive updates about your applications and repayments"
              action="Manage"
              onAction={() => {}}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentSettingsPage;
