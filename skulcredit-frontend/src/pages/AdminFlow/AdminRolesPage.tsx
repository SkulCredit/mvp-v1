import React, { useState } from "react";
import {
  BRAND,
  Ic,
  PlusIcon,
  CloseIcon,
  DrawerShell,
  Field,
  inputCls,
} from "./components/shared";
import { toastSuccess } from "../../utils/toast";

type RoleKey =
  | "super_admin"
  | "admin"
  | "risk_management"
  | "accountant"
  | "customer_service";

interface PermissionGroup {
  group: string;
  icon: string | string[];
  permissions: Permission[];
}

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface RoleDef {
  key: RoleKey;
  label: string;
  description: string;
  color: string;   
  bg: string;    
  locked: boolean;      
  userCount: number;
}

type PermMatrix = Record<RoleKey, Record<string, boolean>>;

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: "Dashboard",
    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    permissions: [
      { key: "dashboard.view",          label: "View Dashboard",          description: "Access the admin dashboard home" },
      { key: "dashboard.analytics",     label: "Platform Analytics",      description: "View charts and performance KPIs" },
    ],
  },
  {
    group: "Schools",
    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    permissions: [
      { key: "schools.view",            label: "View Schools",            description: "List and search school accounts" },
      { key: "schools.create",          label: "Create Schools",          description: "Onboard new school accounts" },
      { key: "schools.edit",            label: "Edit Schools",            description: "Update school details and status" },
      { key: "schools.delete",          label: "Delete Schools",          description: "Permanently remove school accounts" },
      { key: "schools.approve",         label: "Approve / Reject Schools", description: "Approve or reject KYC submissions" },
    ],
  },
  {
    group: "Parents",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    permissions: [
      { key: "parents.view",            label: "View Parents",            description: "List and search parent accounts" },
      { key: "parents.create",          label: "Create Parents",          description: "Register new parent accounts" },
      { key: "parents.edit",            label: "Edit Parents",            description: "Update parent details and KYC status" },
      { key: "parents.delete",          label: "Delete Parents",          description: "Permanently remove parent accounts" },
    ],
  },
  {
    group: "Applications",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
    permissions: [
      { key: "applications.view",       label: "View Applications",       description: "Browse all loan applications" },
      { key: "applications.review",     label: "Review Applications",     description: "Open and assess application details" },
      { key: "applications.approve",    label: "Approve / Reject",        description: "Make credit decisions on applications" },
      { key: "applications.override",   label: "Credit Override",         description: "Override automated risk decisions" },
    ],
  },
  {
    group: "Disbursements",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    permissions: [
      { key: "disbursements.view",      label: "View Disbursements",      description: "See disbursement batches and status" },
      { key: "disbursements.process",   label: "Process Disbursements",   description: "Trigger and schedule payout batches" },
      { key: "disbursements.retry",     label: "Retry Failed",            description: "Retry failed disbursement transactions" },
    ],
  },
  {
    group: "Repayments",
    icon: "M3 9h18M3 15h18M12 3v18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    permissions: [
      { key: "repayments.view",         label: "View Repayments",         description: "Track repayment schedules and history" },
      { key: "repayments.reconcile",    label: "Reconcile",               description: "Perform repayment reconciliation" },
      { key: "repayments.waive",        label: "Waive Penalties",         description: "Waive late-payment fees" },
    ],
  },
  {
    group: "KYC & Compliance",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    permissions: [
      { key: "kyc.view",                label: "View KYC",                description: "View submitted KYC documents" },
      { key: "kyc.approve",             label: "Approve / Reject KYC",    description: "Make KYC verification decisions" },
      { key: "kyc.flag",                label: "Flag for Review",         description: "Flag suspicious or incomplete KYC" },
    ],
  },
  {
    group: "Funding Partners",
    icon: "M3 9h18M3 15h18",
    permissions: [
      { key: "funding.view",            label: "View Partners",           description: "List all funding partners" },
      { key: "funding.manage",          label: "Manage Partners",         description: "Create, edit and deactivate partners" },
    ],
  },
  {
    group: "Support",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    permissions: [
      { key: "support.view",            label: "View Tickets",            description: "Browse support tickets" },
      { key: "support.respond",         label: "Respond to Tickets",      description: "Reply to and resolve tickets" },
      { key: "support.escalate",        label: "Escalate Tickets",        description: "Escalate to senior team" },
    ],
  },
  {
    group: "Admin Users & Roles",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    permissions: [
      { key: "users.view",              label: "View Admin Users",        description: "See the admin users list" },
      { key: "users.manage",            label: "Manage Admin Users",      description: "Create, edit and delete admin accounts" },
      { key: "roles.manage",            label: "Manage Roles",            description: "Edit role permissions" },
    ],
  },
  {
    group: "System Settings",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.071-4.243a7 7 0 0 0-.08-.83l1.8-1.41-1-1.73-2.11.7a7 7 0 0 0-1.43-.83L16 5h-2l-.26 2.11a7 7 0 0 0-1.43.83l-2.11-.7-1 1.73 1.8 1.41a7 7 0 0 0-.08.83 7 7 0 0 0 .08.83l-1.8 1.41 1 1.73 2.11-.7a7 7 0 0 0 1.43.83L14 19h2l.26-2.11a7 7 0 0 0 1.43-.83l2.11.7 1-1.73-1.8-1.41a7 7 0 0 0 .08-.85z",
    permissions: [
      { key: "settings.view",           label: "View Settings",           description: "Read system configuration" },
      { key: "settings.edit",           label: "Edit Settings",           description: "Modify platform settings" },
    ],
  },
  {
    group: "Audit & Export",
    icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    permissions: [
      { key: "audit.view",              label: "View Audit Log",          description: "Browse all system audit events" },
      { key: "audit.export",            label: "Export Data",             description: "Download reports and database exports" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

const INITIAL_ROLES: RoleDef[] = [
  { key: "super_admin",      label: "Super Admin",       description: "Full unrestricted access to every platform feature, setting, and data export.",    color: "#7A0E42", bg: "#fdf0f6", locked: true,  userCount: 1 },
  { key: "admin",            label: "Admin",             description: "Day-to-day operations: schools, parents, applications and disbursements.",          color: "#1d4ed8", bg: "#eff6ff", locked: false, userCount: 2 },
  { key: "risk_management",  label: "Risk Management",   description: "Loan underwriting, risk scoring, KYC review and portfolio oversight.",              color: "#c2410c", bg: "#fff7ed", locked: false, userCount: 2 },
  { key: "accountant",       label: "Accountant",        description: "Financial reconciliation, repayment tracking and data exports.",                    color: "#15803d", bg: "#f0fdf4", locked: false, userCount: 1 },
  { key: "customer_service", label: "Customer Service",  description: "Front-line support: view profiles, respond to tickets and escalate to admin.",      color: "#7c3aed", bg: "#faf5ff", locked: false, userCount: 2 },
];

function buildDefaultMatrix(): PermMatrix {
  const grant = (...keys: string[]) => new Set(keys);

  const perRole: Record<RoleKey, Set<string>> = {
    super_admin: new Set(ALL_PERMISSIONS), // all
    admin: grant(
      "dashboard.view","dashboard.analytics",
      "schools.view","schools.create","schools.edit","schools.delete","schools.approve",
      "parents.view","parents.create","parents.edit","parents.delete",
      "applications.view","applications.review","applications.approve",
      "disbursements.view","disbursements.process","disbursements.retry",
      "repayments.view","repayments.reconcile",
      "kyc.view","kyc.approve","kyc.flag",
      "funding.view","funding.manage",
      "support.view","support.respond","support.escalate",
      "users.view",
      "audit.view","audit.export",
    ),
    risk_management: grant(
      "dashboard.view",
      "schools.view",
      "parents.view",
      "applications.view","applications.review","applications.approve","applications.override",
      "disbursements.view",
      "repayments.view",
      "kyc.view","kyc.approve","kyc.flag",
      "support.view",
      "audit.view",
    ),
    accountant: grant(
      "dashboard.view","dashboard.analytics",
      "schools.view",
      "parents.view",
      "applications.view",
      "disbursements.view",
      "repayments.view","repayments.reconcile","repayments.waive",
      "funding.view",
      "audit.view","audit.export",
    ),
    customer_service: grant(
      "dashboard.view",
      "schools.view",
      "parents.view",
      "applications.view",
      "disbursements.view",
      "repayments.view",
      "kyc.view",
      "support.view","support.respond","support.escalate",
      "audit.view",
    ),
  };

  const matrix = {} as PermMatrix;
  for (const role of INITIAL_ROLES) {
    matrix[role.key] = {};
    for (const key of ALL_PERMISSIONS) {
      matrix[role.key][key] = perRole[role.key].has(key);
    }
  }
  return matrix;
}

const Check: React.FC<{ on: boolean; locked: boolean; onChange: () => void }> = ({ on, locked, onChange }) => (
  <button
    type="button"
    onClick={() => !locked && onChange()}
    disabled={locked}
    aria-label={on ? "Revoke permission" : "Grant permission"}
    className={[
      "w-5 h-5 rounded flex items-center justify-center transition-colors mx-auto",
      locked    ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      on        ? "border-0"                      : "border border-gray-300 hover:border-gray-400 bg-white",
    ].join(" ")}
    style={on ? { backgroundColor: BRAND } : {}}
  >
    {on && (
      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" aria-hidden="true">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);


const AdminRolesPage: React.FC = () => {
  const [roles,  setRoles]  = useState<RoleDef[]>(INITIAL_ROLES);
  const [matrix, setMatrix] = useState<PermMatrix>(() => {
    try {
      const saved = localStorage.getItem("skulcredit_admin_permissions");
      if (saved) return { ...buildDefaultMatrix(), ...JSON.parse(saved) } as PermMatrix;
    } catch { /* ignore */ }
    return buildDefaultMatrix();
  });

  const [activeRole,   setActiveRole]   = useState<RoleKey>("admin");
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<RoleDef | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [matrixSaving, setMatrixSaving] = useState(false);

  const [dLabel, setDLabel]       = useState("");
  const [dDesc,  setDDesc]        = useState("");
  const [dColor, setDColor]       = useState("#7A0E42");
  const [dErrors, setDErrors]     = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditTarget(null);
    setDLabel(""); setDDesc(""); setDColor("#7A0E42"); setDErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (r: RoleDef) => {
    if (r.locked) return;
    setEditTarget(r);
    setDLabel(r.label); setDDesc(r.description); setDColor(r.color); setDErrors({});
    setDrawerOpen(true);
  };

  const handleDrawerSave = async () => {
    const e: Record<string, string> = {};
    if (!dLabel.trim()) e.label = "Label is required.";
    if (Object.keys(e).length) { setDErrors(e); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    if (editTarget) {
      setRoles(prev => prev.map(r => r.key === editTarget.key
        ? { ...r, label: dLabel, description: dDesc, color: dColor }
        : r));
      toastSuccess(`Role "${dLabel}" updated.`);
    }
    setSaving(false);
    setDrawerOpen(false);
  };

  const togglePerm = (role: RoleKey, permKey: string) => {
    if (role === "super_admin") return; 
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [permKey]: !prev[role][permKey] },
    }));
  };

  const saveMatrix = async () => {
    setMatrixSaving(true);
    try {
      localStorage.setItem("skulcredit_admin_permissions", JSON.stringify(matrix));
      await new Promise(r => setTimeout(r, 300)); // simulate async
      toastSuccess("Permission matrix saved (localStorage).");
    } finally {
      setMatrixSaving(false);
    }
  };

  const activeRoleDef = roles.find(r => r.key === activeRole)!;
  const activePerms   = matrix[activeRole] ?? {};
  const grantedCount  = Object.values(activePerms).filter(Boolean).length;

  return (
    <>
      {/* ── Drawer ── */}
      <DrawerShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Edit Role" : "Create Role"}
        subtitle={editTarget ? "Update this role's display label and description." : "Define a new admin role."}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setDrawerOpen(false)} disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleDrawerSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                    style={{ backgroundColor: BRAND }}>
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? "Saving…" : "Save Role"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Role Label" required error={dErrors.label}>
            <input value={dLabel} placeholder="e.g. Risk Analyst"
                   onChange={e => { setDLabel(e.target.value); setDErrors(p => { const n = {...p}; delete n.label; return n; }); }}
                   className={inputCls(dErrors.label)} />
          </Field>
          <Field label="Description">
            <textarea value={dDesc} rows={3} placeholder="What can this role do?"
                      onChange={e => setDDesc(e.target.value)}
                      className={inputCls() + " resize-none"} />
          </Field>
          <Field label="Accent Colour">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg border border-gray-200 shrink-0"
                    style={{ backgroundColor: dColor }} />
              <input value={dColor} maxLength={7}
                     onChange={e => setDColor(e.target.value)}
                     className={inputCls()} />
            </div>
          </Field>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
            After saving the role label, use the <strong>permission matrix</strong> below to assign specific access rights.
          </p>
        </div>
      </DrawerShell>

      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Define what each admin role can see and do across the platform.
            </p>
          </div>
        </div>

        {/* ── Role cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {roles.map(r => {
            const isActive = activeRole === r.key;
            const count = Object.values(matrix[r.key] ?? {}).filter(Boolean).length;
            return (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={[
                  "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                  isActive ? "shadow-md ring-1" : "",
                ].join(" ")}
                style={{
                  borderColor:     isActive ? r.color : "#e5e7eb",
                  backgroundColor: isActive ? r.bg    : "#fff",
                  ...(isActive ? { "--tw-ring-color": r.color } as React.CSSProperties : {}),
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                       style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                        cls="w-4 h-4" />
                  </div>
                  {r.locked && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 uppercase tracking-wide">LOCKED</span>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 truncate">{r.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.userCount} user{r.userCount !== 1 ? "s" : ""}</p>
                <p className="text-xs font-semibold mt-2" style={{ color: r.color }}>
                  {count}/{ALL_PERMISSIONS.length} permissions
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Role header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ backgroundColor: `${activeRoleDef.color}20`, color: activeRoleDef.color }}>
                <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                    cls="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900">{activeRoleDef.label}</h2>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{activeRoleDef.description}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: activeRoleDef.color }}>
                  {grantedCount} of {ALL_PERMISSIONS.length} permissions granted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!activeRoleDef.locked && (
                <button
                  onClick={() => openEdit(activeRoleDef)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cls="w-3.5 h-3.5" />
                  Edit Role
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 py-2.5 bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: BRAND }}>
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              Granted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-gray-300 bg-white inline-block" />
              Not granted
            </span>
            {activeRoleDef.locked && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" cls="w-3 h-3" />
                Super Admin always has all permissions (locked)
              </span>
            )}
          </div>

          {/* Permission matrix */}
          <div className="overflow-x-auto">
            <div className="px-6 py-5 space-y-6 min-w-[600px]">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                         style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                      <Ic d={group.icon} cls="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{group.group}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {group.permissions.map((perm, i) => {
                          const granted = activePerms[perm.key] ?? false;
                          return (
                            <tr key={perm.key}
                                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"} transition-colors hover:bg-[${BRAND}05]`}>
                              <td className="px-4 py-3 w-10 text-center">
                                <Check
                                  on={granted}
                                  locked={activeRoleDef.locked}
                                  onChange={() => togglePerm(activeRole, perm.key)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-gray-800">{perm.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${granted ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                  {granted ? "GRANTED" : "DENIED"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save footer */}
          {!activeRoleDef.locked && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                Changes apply the next time affected users log in or refresh their session.
                <span className="ml-1 text-amber-600 font-medium">(Stored locally — backend roles API coming soon)</span>
              </p>
              <button
                onClick={saveMatrix}
                disabled={matrixSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: BRAND }}
              >
                {matrixSaving
                  ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Ic d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z" cls="w-3.5 h-3.5" />}
                {matrixSaving ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          )}
        </div>

        {/* ── All-roles overview table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-gray-900">All Roles Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Quick comparison across all platform roles.</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: BRAND }}
            >
              <PlusIcon /> New Role
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["ROLE", "USERS", "PERMISSIONS", "STATUS", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roles.map(r => {
                  const count = Object.values(matrix[r.key] ?? {}).filter(Boolean).length;
                  const pct = Math.round((count / ALL_PERMISSIONS.length) * 100);
                  return (
                    <tr key={r.key}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setActiveRole(r.key)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                               style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                            <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                                cls="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{r.label}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[260px]">{r.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold" style={{ color: r.color }}>{r.userCount}</span>
                        <span className="text-xs text-gray-400 ml-1">user{r.userCount !== 1 ? "s" : ""}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-[80px]">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                          </div>
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{count}/{ALL_PERMISSIONS.length}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.locked ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.locked ? "bg-amber-400" : "bg-green-500"}`} />
                          {r.locked ? "System Locked" : "Editable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {!r.locked && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(r); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#7A0E42] hover:bg-[#fdf0f6] transition-colors"
                              title="Edit role"
                            >
                              <Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cls="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); toastSuccess(`Cannot delete "${r.label}" — users are assigned to it.`); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete role"
                            >
                              <Ic d={["M3 6h18","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {r.locked && (
                          <span className="flex justify-end">
                            <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" cls="w-4 h-4 text-gray-300" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminRolesPage;
