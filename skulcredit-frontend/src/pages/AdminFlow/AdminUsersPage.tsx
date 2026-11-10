import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND,
  DrawerShell,
  Field,
  inputCls,
  selectCls,
  SearchIcon,
  ChevronDown,
  Pagination,
  Ic,
  DotsIcon,
  PlusIcon,
  ResetIcon,
} from "./components/shared";

type AdminRole =
  | "super_admin"
  | "admin"
  | "risk_management"
  | "accountant"
  | "customer_service"
  | "customer_service_manager";

type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  twoFaEnabled: boolean;
}

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
  password: string;
  twoFaEnabled: boolean;
}

type FormErrors = Partial<Record<keyof UserForm, string>>;

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "risk_management", label: "Risk Management" },
  { value: "accountant", label: "Accountant" },
  { value: "customer_service", label: "Customer Service" },
  { value: "customer_service_manager", label: "CS Manager" },
];

const ROLE_COLORS: Record<AdminRole, { bg: string; text: string }> = {
  super_admin: { bg: "#fdf0f6", text: "#7A0E42" },
  admin: { bg: "#eff6ff", text: "#1d4ed8" },
  risk_management: { bg: "#fff7ed", text: "#c2410c" },
  accountant: { bg: "#f0fdf4", text: "#15803d" },
  customer_service: { bg: "#faf5ff", text: "#7c3aed" },
  customer_service_manager: { bg: "#f5f3ff", text: "#6d28d9" },
};

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  risk_management: "Risk Management",
  accountant: "Accountant",
  customer_service: "Customer Service",
  customer_service_manager: "CS Manager",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(u: AdminUser) {
  return `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
}

function avatarColor(role: AdminRole) {
  return ROLE_COLORS[role];
}

const RoleBadge: React.FC<{ role: AdminRole }> = ({ role }) => {
  const c = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
};

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => (
  <span
    className={[
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
      status === "active"
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-red-50 text-red-600 border border-red-200",
    ].join(" ")}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-red-500"}`}
    />
    {status === "active" ? "Active" : "Suspended"}
  </span>
);

const RowActions: React.FC<{
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}> = ({ user, onEdit, onDelete, onToggleStatus, onResetPassword }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpen((v) => !v);
  };

  const MENU_W = 208; // w-52

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          width: MENU_W,
          zIndex: 9999,
        }}
        className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden py-1"
      >
        <button
          onClick={() => {
            setOpen(false);
            onEdit();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          <Ic
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            cls="w-4 h-4 text-gray-500 shrink-0"
          />
          Edit User
        </button>
        <button
          onClick={() => {
            setOpen(false);
            onResetPassword();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          <Ic
            d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z"
            cls="w-4 h-4 text-gray-500 shrink-0"
          />
          Reset Password
        </button>
        <button
          onClick={() => {
            setOpen(false);
            onToggleStatus();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors text-left ${
            user.status === "active" ? "text-amber-600" : "text-green-600"
          }`}
        >
          <Ic
            d={
              user.status === "active"
                ? "M10 9v6m4-6v6M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                : "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            }
            cls={`w-4 h-4 shrink-0 ${user.status === "active" ? "text-amber-500" : "text-green-500"}`}
          />
          {user.status === "active" ? "Suspend User" : "Reactivate User"}
        </button>
        <div className="h-px bg-gray-100 mx-3 my-1" />
        <button
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
        >
          <Ic
            d={[
              "M3 6h18",
              "M19 6l-1 14H6L5 6",
              "M10 11v6",
              "M14 11v6",
              "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
            ]}
            cls="w-4 h-4 text-red-400 shrink-0"
          />
          Delete User
        </button>
      </div>,
      document.body,
    );

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Actions"
        aria-expanded={open}
      >
        <DotsIcon />
      </button>
      {menu}
    </div>
  );
};

const BLANK_FORM: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "admin",
  password: "",
  twoFaEnabled: false,
};

const UserDrawer: React.FC<{
  open: boolean;
  editing: AdminUser | null;
  onClose: () => void;
  onSave: (form: UserForm) => void;
  saving: boolean;
}> = ({ open, editing, onClose, onSave, saving }) => {
  const [form, setForm] = useState<UserForm>(BLANK_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              firstName: editing.firstName,
              lastName: editing.lastName,
              email: editing.email,
              phone: editing.phone,
              role: editing.role,
              password: "",
              twoFaEnabled: editing.twoFaEnabled,
            }
          : BLANK_FORM,
      );
      setErrors({});
    }
  }, [open, editing]);

  const set = <K extends keyof UserForm>(k: K, v: UserForm[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Required.";
    if (!form.lastName.trim()) e.lastName = "Required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required.";
    if (!form.phone.trim()) e.phone = "Required.";
    if (!editing && !form.password)
      e.password = "Password required for new users.";
    if (!editing && form.password && form.password.length < 8)
      e.password = "Minimum 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title={editing ? "Edit Admin User" : "Add Admin User"}
      subtitle={
        editing
          ? "Update account details and role assignment."
          : "Create a new internal admin account."
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
          </button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" required error={errors.firstName}>
            <input
              value={form.firstName}
              placeholder="e.g. Amaka"
              onChange={(e) => set("firstName", e.target.value)}
              className={inputCls(errors.firstName)}
            />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <input
              value={form.lastName}
              placeholder="e.g. Eze"
              onChange={(e) => set("lastName", e.target.value)}
              className={inputCls(errors.lastName)}
            />
          </Field>
        </div>

        <Field label="Email Address" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            placeholder="user@skulcredit.com"
            onChange={(e) => set("email", e.target.value)}
            className={inputCls(errors.email)}
          />
        </Field>

        <Field label="Phone Number" required error={errors.phone}>
          <input
            type="tel"
            value={form.phone}
            placeholder="08031000000"
            onChange={(e) => set("phone", e.target.value)}
            className={inputCls(errors.phone)}
          />
        </Field>

        {/* Role selector with colour preview */}
        <Field label="Role" required>
          <div className="relative">
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value as AdminRole)}
              className={selectCls()}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>
          {/* Role colour pill preview */}
          <div className="mt-2">
            <RoleBadge role={form.role} />
          </div>
        </Field>

        {/* Password */}
        <Field
          label={editing ? "New Password" : "Password"}
          required={!editing}
          error={errors.password}
        >
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              placeholder={
                editing ? "Leave blank to keep current" : "Min. 8 characters"
              }
              onChange={(e) => set("password", e.target.value)}
              className={inputCls(errors.password) + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <Ic
                d={
                  showPw
                    ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
                    : "M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                }
                cls="w-4 h-4"
              />
            </button>
          </div>
        </Field>

        {/* 2FA toggle */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Require Two-Factor Authentication
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              User must set up 2FA on next login
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.twoFaEnabled}
            onClick={() => set("twoFaEnabled", !form.twoFaEnabled)}
            className="relative shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none"
            style={{
              width: 40,
              height: 22,
              backgroundColor: form.twoFaEnabled ? BRAND : "#d1d5db",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
              style={{
                transform: form.twoFaEnabled
                  ? "translateX(18px)"
                  : "translateX(0)",
              }}
            />
          </button>
        </div>

        {/* Role description card */}
        <RoleInfoCard role={form.role} />
      </form>
    </DrawerShell>
  );
};

const ROLE_DESCRIPTIONS: Record<
  AdminRole,
  { summary: string; permissions: string[] }
> = {
  super_admin: {
    summary: "Full unrestricted platform access.",
    permissions: [
      "All admin actions",
      "User & role management",
      "System settings",
      "Data export & backups",
      "Danger zone actions",
    ],
  },
  admin: {
    summary: "Day-to-day operations management.",
    permissions: [
      "Manage schools & parents",
      "Review applications",
      "Process disbursements",
      "View audit log",
    ],
  },
  risk_management: {
    summary: "Loan risk assessment and portfolio oversight.",
    permissions: [
      "View & score applications",
      "Flag suspicious activity",
      "Risk reports",
      "KYC review",
    ],
  },
  accountant: {
    summary: "Financial tracking and reconciliation.",
    permissions: [
      "View disbursements",
      "Repayment tracking",
      "Export financial reports",
      "Reconciliation tools",
    ],
  },
  customer_service: {
    summary: "Front-line support for parents and schools.",
    permissions: [
      "View parent & school profiles",
      "Respond to support tickets",
      "View application status",
      "Escalate to admin",
    ],
  },
  customer_service_manager: {
    summary: "Oversees the customer service team.",
    permissions: [
      "All customer service actions",
      "Assign and manage CS agents",
      "View escalated tickets",
      "Generate CS reports",
    ],
  },
};

const RoleInfoCard: React.FC<{ role: AdminRole }> = ({ role }) => {
  const info = ROLE_DESCRIPTIONS[role];
  const c = ROLE_COLORS[role];
  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-2"
      style={{ borderColor: `${c.text}30`, backgroundColor: c.bg }}
    >
      <p className="text-xs font-bold" style={{ color: c.text }}>
        {ROLE_LABELS[role]}
      </p>
      <p className="text-xs text-gray-600 leading-relaxed">{info.summary}</p>
      <ul className="space-y-0.5">
        {info.permissions.map((p) => (
          <li
            key={p}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span style={{ color: c.text }}>
              <Ic d="M9 12l2 2 4-4" cls="w-3 h-3 shrink-0" />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
};

const DeleteModal: React.FC<{
  user: AdminUser;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ user, loading, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-8 text-center shadow-xl">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <Ic
            d={[
              "M3 6h18",
              "M19 6l-1 14H6L5 6",
              "M10 11v6",
              "M14 11v6",
              "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
            ]}
            cls="w-5 h-5 text-red-500"
          />
        </div>
      </div>
      <h2 className="text-base font-bold text-gray-800">Delete Admin User?</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        <strong>
          {user.firstName} {user.lastName}
        </strong>{" "}
        ({user.email}) will be permanently removed. This cannot be undone.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

interface BackendUser {
  id: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  adminProfile?: { fullName?: string | null; phone?: string | null } | null;
  parentProfile?: { firstName?: string; lastName?: string } | null;
  schoolProfile?: { schoolName?: string } | null;
}

function mapUser(u: BackendUser): AdminUser {
  const names = (() => {
    // 1. Prefer adminProfile.fullName (staff users created via admin UI)
    if (u.adminProfile?.fullName) {
      const parts = u.adminProfile.fullName.trim().split(/\s+/);
      return {
        firstName: parts[0] ?? "—",
        lastName: parts.slice(1).join(" "),
      };
    }
    // 2. Parent profile (if a parent appears here)
    if (u.parentProfile?.firstName) {
      return {
        firstName: u.parentProfile.firstName,
        lastName: u.parentProfile.lastName ?? "",
      };
    }
    // 3. Fallback: derive from email local part
    const parts = u.email.split("@")[0].split(".");
    return { firstName: parts[0] ?? "—", lastName: parts.slice(1).join(" ") };
  })();

  const roleMap: Record<string, AdminRole> = {
    admin: "admin",
    super_admin: "super_admin",
    risk_management: "risk_management",
    accountant: "accountant",
    customer_service: "customer_service",
    customer_service_manager: "customer_service_manager",
  };

  return {
    id: u.id,
    firstName: names.firstName,
    lastName: names.lastName,
    email: u.email,
    phone: u.phoneNumber ?? "",
    role: roleMap[u.role] ?? "admin",
    status: u.isActive ? "active" : "suspended",
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    twoFaEnabled: false,
  };
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const LIMIT = 10;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiClient.get<{ data: BackendUser[] }>("/admin/users");
      setUsers((res.data.data ?? []).map(mapUser));
    } catch (err) {
      setFetchError(
        (err as { message?: string }).message ?? "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    const matchFrom = !dateFrom || u.createdAt >= dateFrom;
    const matchTo = !dateTo || u.createdAt <= dateTo + "T23:59:59";
    return matchSearch && matchRole && matchStatus && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const roleCounts = ROLE_OPTIONS.map((r) => ({
    ...r,
    count: users.filter((u) => u.role === r.value).length,
  }));

  const openCreate = () => {
    setEditTarget(null);
    setDrawerOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setDrawerOpen(true);
  };

  const handleSave = async (form: UserForm) => {
    setSaving(true);
    try {
      if (editTarget) {
        await apiClient.patch(`/admin/users/${editTarget.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phone,
          role: form.role,
        });
        toastSuccess("User updated successfully.");
        await fetchUsers();
      } else {
        await apiClient.post("/admin/users", {
          email: form.email,
          password: form.password,
          phoneNumber: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
        });
        toastSuccess("User created successfully.");
        await fetchUsers();
      }
      setDrawerOpen(false);
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.patch(`/admin/users/${deleteTarget.id}/toggle-active`, {
        isActive: false,
      });
      setDeleteTarget(null);
      toastSuccess("User deactivated.");
      await fetchUsers();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Action failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (u: AdminUser) => {
    try {
      const newActive = u.status !== "active";
      await apiClient.patch(`/admin/users/${u.id}/toggle-active`, {
        isActive: newActive,
      });
      toastSuccess(
        newActive ? `${u.firstName} reactivated.` : `${u.firstName} suspended.`,
      );
      await fetchUsers();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Action failed.");
    }
  };

  const handleResetPassword = (u: AdminUser) => {
    toastSuccess(`Password reset email sent to ${u.email}.`);
  };

  const COLS = ["USER", "ROLE", "STATUS", "2FA", "LAST LOGIN", "CREATED", ""];

  return (
    <>
      <UserDrawer
        open={drawerOpen}
        editing={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        saving={saving}
      />

      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              Internal staff accounts · manage roles, access and credentials
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0 transition-colors"
            style={{ backgroundColor: BRAND }}
          >
            <PlusIcon /> Add User
          </button>
        </div>

        {fetchError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {/* Role summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {roleCounts.map((r) => {
            const c = ROLE_COLORS[r.value];
            const active = roleFilter === r.value;
            return (
              <button
                key={r.value}
                onClick={() => {
                  setRoleFilter(active ? "" : r.value);
                  setPage(1);
                }}
                className={[
                  "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                  active ? "shadow-sm" : "",
                ].join(" ")}
                style={{
                  borderColor: active ? c.text : "#e5e7eb",
                  backgroundColor: active ? c.bg : "#fff",
                }}
              >
                {loading ? (
                  <div className="h-7 w-8 bg-gray-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold" style={{ color: c.text }}>
                    {r.count}
                  </p>
                )}
                <p className="text-xs font-semibold text-gray-600 mt-1 leading-snug">
                  {r.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as AdminRole | "");
                setPage(1);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | "");
                setPage(1);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <ChevronDown />
            </span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            title="To date"
          />
          {(search || roleFilter || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 shrink-0">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {COLS.map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {COLS.map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div
                            className="h-4 bg-gray-100 rounded animate-pulse"
                            style={{ width: j === 0 ? 160 : 80 }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={COLS.length}
                      className="px-5 py-16 text-center text-sm text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => {
                    const c = avatarColor(u.role);
                    return (
                      <tr
                        key={u.id}
                        className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: c.bg, color: c.text }}
                            >
                              {initials(u)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {u.email}
                              </p>
                              {u.phone && (
                                <p className="text-xs text-gray-300 truncate">
                                  {u.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.twoFaEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${u.twoFaEnabled ? "bg-green-500" : "bg-gray-400"}`}
                            />
                            {u.twoFaEnabled ? "On" : "Off"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {timeAgo(u.lastLogin)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                          {fmtDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <RowActions
                            user={u}
                            onEdit={() => openEdit(u)}
                            onDelete={() => setDeleteTarget(u)}
                            onToggleStatus={() => handleToggleStatus(u)}
                            onResetPassword={() => handleResetPassword(u)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 h-20 animate-pulse bg-gray-50" />
              ))
            ) : paginated.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">
                No users found.
              </p>
            ) : (
              paginated.map((u) => {
                const c = avatarColor(u.role);
                return (
                  <div
                    key={u.id}
                    className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: c.bg, color: c.text }}
                    >
                      {initials(u)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <RoleBadge role={u.role} />
                        <StatusBadge status={u.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Last login: {timeAgo(u.lastLogin)}
                      </p>
                    </div>
                    <RowActions
                      user={u}
                      onEdit={() => openEdit(u)}
                      onDelete={() => setDeleteTarget(u)}
                      onToggleStatus={() => handleToggleStatus(u)}
                      onResetPassword={() => handleResetPassword(u)}
                    />
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > LIMIT && (
            <Pagination
              meta={{ total: filtered.length, page, limit: LIMIT }}
              page={page}
              totalPages={totalPages}
              label="users"
              onPage={setPage}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminUsersPage;
