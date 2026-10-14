import React, { useEffect, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { toastSuccess, toastError } from "../../utils/toast";

const BRAND = "#7A0E42";

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 bg-white " +
  "outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-colors";

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  department?: string | null;
  employeeId?: string | null;
}

const CSProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  const [loading,  setLoading]  = useState(true);
  const [profile,  setProfile]  = useState<ProfileData | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [avatarUrl,setAvatarUrl]= useState<string | null>(null);

  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword]  = useState("");
  const [newPassword,     setNewPassword]      = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [changingPassword,setChangingPassword] = useState(false);
  const [showCurrent,     setShowCurrent]      = useState(false);
  const [showNew,         setShowNew]          = useState(false);
  const [showConfirm,     setShowConfirm]      = useState(false);

  const [deleteConfirm,   setDeleteConfirm]    = useState(false);
  const [deleting,        setDeleting]         = useState(false);
  const [deleteText,      setDeleteText]       = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<{ data: ProfileData }>("/cs/profile")
      .then(res => {
        const d = res.data.data;
        setProfile(d);
        setFullName(d.fullName ?? "");
        setPhone(d.phoneNumber ?? d.phone ?? "");
        setEmail(d.email ?? "");
        setAvatarUrl(d.avatarUrl ?? null);
      })
      .catch(() => {
        const fallback: ProfileData = {
          id: user?.id ?? "",
          email: user?.email ?? "",
          fullName: user?.name ?? null,
          phoneNumber: user?.phoneNumber ?? null,
          phone: null,
          avatarUrl: user?.profilePhotoUrl ?? null,
          createdAt: user?.createdAt ?? new Date().toISOString(),
        };
        setProfile(fallback);
        setFullName(fallback.fullName ?? "");
        setPhone(fallback.phoneNumber ?? fallback.phone ?? "");
        setEmail(fallback.email ?? "");
        setAvatarUrl(fallback.avatarUrl ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put("/cs/profile", { fullName, phone });
      setUser(prev => prev ? { ...prev, name: fullName, phoneNumber: phone } : prev);
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
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const uploadRes = await apiClient.post<{ data: { url: string } }>("/cs/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploadRes.data.data.url;
      await apiClient.put("/cs/profile", { fullName, phone, avatarUrl: url });
      setAvatarUrl(url);
      setUser(prev => prev ? { ...prev, profilePhotoUrl: url } : prev);
      toastSuccess("Profile photo updated.");
    } catch {
      toastError("Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.post("/cs/profile/change-password", { currentPassword, newPassword });
      toastSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError(msg ?? "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      toastError('Please type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await apiClient.delete("/cs/profile");
      toastSuccess("Account deleted.");
    } catch {
      toastError("Failed to delete account. Contact your administrator.");
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const initials = fullName && fullName.trim()
    ? fullName.trim().split(" ").map(n => n[0] ?? '').join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  const EyeIcon = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      <Ic d={show
        ? "M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        : ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24", "M1 1l22 22"]
      } cls="w-4 h-4" />
    </button>
  );

  if (loading) {
    return (
      <div className="pt-6 pb-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile, security, and account settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-white text-2xl font-bold"
                 style={{ backgroundColor: BRAND }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{fullName || email}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: BRAND }}>Customer Service</span>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
              </button>
              {avatarUrl && (
                <button
                  onClick={() => { setAvatarUrl(null); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
              <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
              <input className={inputCls + " bg-gray-50 cursor-not-allowed"} value={email} readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." type="tel" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Account Type</label>
              <input className={inputCls + " bg-gray-50 cursor-not-allowed"} value="Customer Service" readOnly />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ backgroundColor: BRAND }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-5">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Password</label>
            <input
              className={inputCls + " pr-10"}
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <EyeIcon show={showCurrent} toggle={() => setShowCurrent(v => !v)} />
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
            <input
              className={inputCls + " pr-10"}
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
            <EyeIcon show={showNew} toggle={() => setShowNew(v => !v)} />
          </div>
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm New Password</label>
            <input
              className={inputCls + " pr-10"}
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
            <EyeIcon show={showConfirm} toggle={() => setShowConfirm(v => !v)} />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}>
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h3>
        <p className="text-xs text-gray-500 mb-4">
          Permanently deleting your account cannot be undone. All your data will be removed. This action requires administrator approval.
        </p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Type <strong>DELETE</strong> to confirm account deletion:
            </p>
            <input
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm text-gray-800 bg-white outline-none focus:ring-2 focus:ring-red-200 transition-colors"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteText !== "DELETE"}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSProfilePage;
