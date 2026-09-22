import React, { useRef, useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

// ── Input style ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

// ── Page ──────────────────────────────────────────────────────────────────────
const SchoolSettingsPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile
  const [name, setName] = useState(user?.name ?? "John Administrator");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "+234-903 123 4567");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // School info
  const [schoolName, setSchoolName] = useState(
    user?.schoolName ?? user?.name ?? "Springfield High School",
  );
  const [address, setAddress] = useState(
    "123 Education Avenue, Lagos, Nigeria",
  );
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolMsg, setSchoolMsg] = useState("");

  const handleDocUpload = async (file: File) => {
    setDocFile(file);
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiClient.post("/upload/document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch {
      /* silent */
    } finally {
      setDocUploading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await apiClient.put("/schools/profile", {
        contactPerson: name,
        phoneNumber: phone,
      });
      setProfileMsg("Profile saved successfully.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setProfileMsg(ax.response?.data?.message ?? "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolSaving(true);
    setSchoolMsg("");
    try {
      await apiClient.put("/schools/profile", { addressStreet: address });
      setSchoolMsg("School information saved.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setSchoolMsg(ax.response?.data?.message ?? "Failed to save school info.");
    } finally {
      setSchoolSaving(false);
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
      <div className="pt-8 space-y-5 animate-fade-in-up w-[90%] mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">
              Manage your profile, school information, and bank details.
            </p>
          </div>
          <Icon name="settings" className="w-7 h-7 text-slate-400" />
        </div>

        {/* ── Profile Settings ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">
            Profile Settings
          </h2>
          <form className="space-y-4" onSubmit={saveProfile}>
            {profileMsg && (
              <p
                className={`text-xs font-medium ${profileMsg.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}
              >
                {profileMsg}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? "admin@springfield.edu.ng"}
                disabled
                className={
                  inputCls + " bg-slate-50 cursor-not-allowed text-slate-400"
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value="••••••••••"
                  readOnly
                  className={inputCls + " cursor-not-allowed pr-36"}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                >
                  <Icon name="lock" className="w-3.5 h-3.5" />
                  Change Password
                  <Icon name="chevron-right" className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] disabled:opacity-60 transition-colors"
            >
              <Icon name="save" className="w-4 h-4" />
              {profileSaving ? "Saving…" : "Save Profile Changes"}
            </button>
          </form>
        </div>

        {/* ── School Information ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">
            School Information
          </h2>
          <form className="space-y-4" onSubmit={saveSchool}>
            {schoolMsg && (
              <p
                className={`text-xs font-medium ${schoolMsg.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}
              >
                {schoolMsg}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                School Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Documents
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={docUploading}
                className="flex items-center gap-2 bg-brand/10 text-brand text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand/20 disabled:opacity-60 transition-colors"
              >
                {docUploading ? (
                  <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="upload-cloud" className="w-4 h-4" />
                )}
                {docFile ? docFile.name : "Upload or Replace Document"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleDocUpload(f);
                }}
              />
            </div>

            {/* Note banner */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <Icon
                name="info"
                className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Note: </span>
                Updating school information may require re-verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={schoolSaving}
              className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] disabled:opacity-60 transition-colors"
            >
              <Icon name="save" className="w-4 h-4" />
              {schoolSaving ? "Saving…" : "Save Profile Changes"}
            </button>
          </form>
        </div>

        {/* ── Bank Details ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-slate-800">Bank Details</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Icon name="check-circle" className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>

          <div className="space-y-0">
            {[
              { label: "Bank Name:", value: "Zenith Bank" },
              { label: "Account Number:", value: "0123456789" },
              { label: "Bank Name:", value: "Zenith Bank" },
              { label: "Account Holder:", value: "School Administrator" },
              {
                label: "Verification Status:",
                value: "✅ Verified (Read-Only)",
              },
            ].map(({ label, value }) => (
              <div
                key={label + value}
                className="flex justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mt-4">
            <Icon
              name="info"
              className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Note: </span>
              For any changes to bank details, please contact support.
            </p>
          </div>

          <button className="mt-4 flex items-center gap-2 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#7a1848] transition-colors">
            <Icon name="headset" className="w-4 h-4" />
            Contact Support
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSettingsPage;
