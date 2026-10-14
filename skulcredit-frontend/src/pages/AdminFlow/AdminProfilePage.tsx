import React, { useEffect, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { toastSuccess, toastError } from "../../utils/toast";
import { resolveUploadUrl } from "../../utils/uploadUrl";

const BRAND = "#7A0E42";

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 bg-white " +
  "outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-colors";

interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

const AdminProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving]         = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<{ data: ProfileData }>("/admin/profile")
      .then((res) => {
        const d = res.data.data;
        setProfile(d);
        setFullName(d.fullName ?? "");
        setPhone(d.phone ?? "");
        setEmail(d.email ?? "");
        setAvatarUrl(d.avatarUrl ?? null);
      })
      .catch(() => toastError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.put<{ data: ProfileData }>("/admin/profile", {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
      });
      const d = res.data.data;
      setProfile(d);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: d.fullName ?? prev.name,
              firstName: d.fullName?.split(" ")[0] ?? prev.firstName,
              lastName: d.fullName?.split(" ").slice(1).join(" ") || prev.lastName,
              profilePhotoUrl: d.avatarUrl ?? prev.profilePhotoUrl,
            }
          : prev,
      );
      toastSuccess("Profile updated successfully.");
    } catch {
      toastError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError("Image must be under 5 MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      // 1. Upload to role-specific directory photos/admin/{adminId}/
      const formData = new FormData();
      formData.append("avatar", file);
      const uploadRes = await apiClient.post<{ data: { url: string } }>(
        "/admin/profile/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const url = uploadRes.data.data.url;
      // 2. Save the URL to the profile
      await apiClient.put("/admin/profile", { avatarUrl: url });
      setAvatarUrl(url);
      setUser((prev) => prev ? { ...prev, profilePhotoUrl: url } : prev);
      toastSuccess("Avatar updated.");
    } catch {
      toastError("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.put("/admin/profile/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toastSuccess("Password changed successfully.");
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = (fullName || user?.name || email || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and password.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={resolveUploadUrl(avatarUrl)} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: BRAND }}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
                aria-label="Change avatar"
              >
                {uploadingAvatar ? (
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{fullName || user?.name || email}</p>
              <p className="text-sm text-gray-500 mt-0.5">{email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Personal Information</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input
                value={email}
                disabled
                className={inputCls + " bg-gray-50 cursor-not-allowed text-gray-400"}
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact a super admin.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className={inputCls}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={inputCls + " pr-10"}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    {showCurrent
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={inputCls + " pr-10"}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    {showNew
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={inputCls + " pr-10"}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    {showConfirm
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 font-medium">Passwords do not match.</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: BRAND }}
              >
                {changingPassword ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {changingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminProfilePage;
