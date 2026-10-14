import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BRAND = "#7A0E42";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchEntry {
  label: string;    // Primary title shown
  subtitle: string; // Breadcrumb shown below label
  path: string;     // Route to navigate to (may include ?tab= or #section)
  icon: string;     // SVG path
  keywords: string; // Extra search terms (pipe-separated intent phrases)
}

// ─── SVG paths ────────────────────────────────────────────────────────────────

const P = {
  dashboard:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  customers:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  applications: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  funding:      "M3 9h18M3 15h18M12 3v18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  compliance:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  support:      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  audit:        "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  analytics:    "M18 20V10M12 20V4M6 20v-6",
  users:        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  settings:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.071-4.243a7 7 0 0 0-.08-.83l1.8-1.41-1-1.73-2.11.7a7 7 0 0 0-1.43-.83L16 5h-2l-.26 2.11a7 7 0 0 0-1.43.83l-2.11-.7-1 1.73 1.8 1.41a7 7 0 0 0-.08.83 7 7 0 0 0 .08.83l-1.8 1.41 1 1.73 2.11-.7a7 7 0 0 0 1.43.83L14 19h2l.26-2.11a7 7 0 0 0 1.43-.83l2.11.7 1-1.73-1.8-1.41a7 7 0 0 0 .08-.85z",
  security:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  database:     "M12 2a10 10 0 0 1 0 4M12 2a10 10 0 0 0 0 4M2 12a10 10 0 0 0 10 10M2 12a10 10 0 0 1 10 10M22 12a10 10 0 0 0-10 10",
  notif:        "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  issues:       "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  schools:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  escalations:  "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  knowledge:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  reports:      "M18 20V10M12 20V4M6 20v-6",
  profile:      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  lock:         "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  mail:         "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5",
  save:         "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  warn:         "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  role:         "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

// ─── ADMIN search index ───────────────────────────────────────────────────────
// Covers every page AND every in-page tab / section / feature visible to admins.

const ADMIN_INDEX: SearchEntry[] = [

  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    label: "Dashboard",
    subtitle: "Home",
    path: "/admin/dashboard",
    icon: P.dashboard,
    keywords: "overview platform performance KPI stats metrics total schools applications disbursements revenue service charge",
  },

  // ── Schools ───────────────────────────────────────────────────────────────
  {
    label: "Schools",
    subtitle: "Customers · Customer Management",
    path: "/admin/schools",
    icon: P.schools,
    keywords: "school list all schools manage partner institution registration KYC status approved pending under review rejected add create school contact person address city state",
  },
  {
    label: "Approved Schools",
    subtitle: "Customers · Schools",
    path: "/admin/schools?status=approved",
    icon: P.schools,
    keywords: "approved schools verified partner",
  },
  {
    label: "Pending Schools",
    subtitle: "Customers · Schools",
    path: "/admin/schools?status=pending",
    icon: P.schools,
    keywords: "pending schools awaiting review new registration",
  },
  {
    label: "Schools Under Review",
    subtitle: "Customers · Schools",
    path: "/admin/schools?status=under_review",
    icon: P.schools,
    keywords: "under review schools being processed",
  },

  // ── Parents ───────────────────────────────────────────────────────────────
  {
    label: "Parents",
    subtitle: "Customers · Customer Management",
    path: "/admin/parents",
    icon: P.customers,
    keywords: "parent list all parents borrower manage email phone active inactive add create parent account",
  },
  {
    label: "Parents KYC Verified",
    subtitle: "Customers · Parents",
    path: "/admin/parents?kycStatus=approved",
    icon: P.customers,
    keywords: "kyc verified approved parents identity confirmed NIN BVN",
  },
  {
    label: "Parents KYC Pending",
    subtitle: "Customers · Parents",
    path: "/admin/parents?kycStatus=pending",
    icon: P.customers,
    keywords: "kyc pending parents verification awaiting submitted",
  },

  // ── Applications ──────────────────────────────────────────────────────────
  {
    label: "All Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications",
    icon: P.applications,
    keywords: "loan applications list reference number student tuition amount requested status",
  },
  {
    label: "Pending Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=pending",
    icon: P.applications,
    keywords: "pending loan applications awaiting review new submitted",
  },
  {
    label: "Applications Under Review",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=under_review",
    icon: P.applications,
    keywords: "under review applications being processed checking",
  },
  {
    label: "Info Requested Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=info_requested",
    icon: P.applications,
    keywords: "info requested applications additional information needed",
  },
  {
    label: "School Verification Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=school_verification",
    icon: P.applications,
    keywords: "school verification applications awaiting school confirmation enrollment",
  },
  {
    label: "Approved Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=approved",
    icon: P.applications,
    keywords: "approved loan applications ready for disbursement",
  },
  {
    label: "Disbursed Loans",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=disbursed",
    icon: P.applications,
    keywords: "disbursed loans paid out funded released money sent",
  },
  {
    label: "Repaid Loans",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=repaid",
    icon: P.applications,
    keywords: "repaid loans fully paid completed settled",
  },
  {
    label: "Rejected Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=rejected",
    icon: P.applications,
    keywords: "rejected declined denied loan applications",
  },
  {
    label: "Cancelled Applications",
    subtitle: "Customers · Applications",
    path: "/admin/applications?status=cancelled",
    icon: P.applications,
    keywords: "cancelled withdrawn loan applications",
  },

  // ── Funding Partners ──────────────────────────────────────────────────────
  {
    label: "Partners List",
    subtitle: "Operations · Funding Partners",
    path: "/admin/funding-partners",
    icon: P.funding,
    keywords: "funding partners list lenders investors capital providers bank finance",
  },
  {
    label: "Disbursement Requests",
    subtitle: "Operations · Funding Partners",
    path: "/admin/funding-partners/requests",
    icon: P.funding,
    keywords: "disbursement requests funding payout release money transfer pending approved rejected",
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  {
    label: "Compliance",
    subtitle: "Back Office",
    path: "/admin/compliance",
    icon: P.compliance,
    keywords: "compliance overview KYC stats total parents verified pending submitted rejected",
  },
  {
    label: "KYC Review",
    subtitle: "Back Office · Compliance",
    path: "/admin/compliance",
    icon: P.compliance,
    keywords: "KYC review parent identity verification NIN BVN income employment document approve reject",
  },
  {
    label: "KYC Pending Review",
    subtitle: "Back Office · Compliance",
    path: "/admin/compliance",
    icon: P.compliance,
    keywords: "kyc pending compliance queue awaiting review submitted documents",
  },
  {
    label: "AML / Fraud Checks",
    subtitle: "Back Office · Compliance",
    path: "/admin/compliance",
    icon: P.security,
    keywords: "AML anti money laundering fraud check risk compliance regulatory",
  },

  // ── Support ───────────────────────────────────────────────────────────────
  {
    label: "Support",
    subtitle: "Back Office",
    path: "/admin/support",
    icon: P.support,
    keywords: "support tickets customer service issues help desk queue manage all tickets",
  },
  {
    label: "Open Support Tickets",
    subtitle: "Back Office · Support",
    path: "/admin/support",
    icon: P.support,
    keywords: "open tickets unresolved pending issues support queue",
  },
  {
    label: "Resolved Tickets",
    subtitle: "Back Office · Support",
    path: "/admin/support",
    icon: P.support,
    keywords: "resolved closed tickets support history closed",
  },
  {
    label: "Assign Support Ticket",
    subtitle: "Back Office · Support",
    path: "/admin/support",
    icon: P.support,
    keywords: "assign ticket customer service agent escalate",
  },

  // ── Audit Log ─────────────────────────────────────────────────────────────
  {
    label: "Audit Log",
    subtitle: "Back Office",
    path: "/admin/audit",
    icon: P.audit,
    keywords: "audit log activity history trail events changes user actions timestamps security",
  },
  {
    label: "Admin Activity Log",
    subtitle: "Back Office · Audit Log",
    path: "/admin/audit",
    icon: P.audit,
    keywords: "admin activity log user actions create update delete login logout",
  },
  {
    label: "API Request Log",
    subtitle: "Back Office · Audit Log",
    path: "/admin/audit",
    icon: P.audit,
    keywords: "API request log HTTP method endpoint status code response",
  },
  {
    label: "Export Audit Logs",
    subtitle: "Back Office · Audit Log",
    path: "/admin/audit",
    icon: P.save,
    keywords: "export audit logs CSV download audit trail",
  },
  {
    label: "Audit Log Severity Filter",
    subtitle: "Back Office · Audit Log",
    path: "/admin/audit",
    icon: P.audit,
    keywords: "severity filter critical high medium low audit log filter",
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    label: "Analytics",
    subtitle: "Back Office",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "analytics reports charts graphs trends data insights overview",
  },
  {
    label: "Revenue Analytics",
    subtitle: "Back Office · Analytics",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "revenue service charge income financial analytics monthly weekly total",
  },
  {
    label: "Disbursement Analytics",
    subtitle: "Back Office · Analytics",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "disbursement analytics charts loan payouts funding trends volume",
  },
  {
    label: "Repayment Analytics",
    subtitle: "Back Office · Analytics",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "repayment recovery collected overdue analytics performance rate",
  },
  {
    label: "Application Analytics",
    subtitle: "Back Office · Analytics",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "application stats analytics approved rejected disbursed by status period",
  },
  {
    label: "Market Projections",
    subtitle: "Back Office · Analytics",
    path: "/admin/analytics",
    icon: P.analytics,
    keywords: "market projections forecast growth target goal analytics",
  },

  // ── Admin Users ───────────────────────────────────────────────────────────
  {
    label: "Admin Users",
    subtitle: "Back Office · Users & Roles",
    path: "/admin/users",
    icon: P.users,
    keywords: "admin users staff team members accounts list manage active inactive",
  },
  {
    label: "Invite Admin User",
    subtitle: "Back Office · Users & Roles",
    path: "/admin/users",
    icon: P.users,
    keywords: "invite create add new admin user staff member team",
  },
  {
    label: "Deactivate Admin User",
    subtitle: "Back Office · Users & Roles",
    path: "/admin/users",
    icon: P.users,
    keywords: "deactivate suspend disable admin user account access",
  },
  {
    label: "Roles & Permissions",
    subtitle: "Back Office · Users & Roles",
    path: "/admin/users/roles",
    icon: P.role,
    keywords: "roles permissions access control RBAC assign role create role edit delete",
  },
  {
    label: "Role Definitions",
    subtitle: "Back Office · Users & Roles",
    path: "/admin/users/roles",
    icon: P.role,
    keywords: "role definitions super admin risk management accountant customer service permissions capabilities",
  },

  // ── Settings — Security tab ───────────────────────────────────────────────
  {
    label: "Settings",
    subtitle: "Back Office",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "settings configuration system platform all settings",
  },
  {
    label: "Security Settings",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.security,
    keywords: "security settings two factor authentication 2FA password policy login lockout token JWT session",
  },
  {
    label: "Two-Factor Authentication (2FA)",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.lock,
    keywords: "two factor authentication 2FA enable disable TOTP authenticator app email OTP SMS enforce roles",
  },
  {
    label: "Password Policy",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.lock,
    keywords: "password policy minimum length uppercase number symbol requirement enforce",
  },
  {
    label: "JWT Token Expiry",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.security,
    keywords: "JWT access token expiry hours session timeout refresh token days",
  },
  {
    label: "Session Timeout",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.security,
    keywords: "idle session timeout auto logout inactivity minutes",
  },
  {
    label: "Login Security",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.lock,
    keywords: "login security max failed attempts lockout duration brute force protection",
  },
  {
    label: "IP Allowlist",
    subtitle: "Settings · Security",
    path: "/admin/settings",
    icon: P.security,
    keywords: "IP allowlist whitelist restrict access allowed IPs CIDR ranges firewall",
  },

  // ── Settings — Database tab ───────────────────────────────────────────────
  {
    label: "Database Settings",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "database settings backup automated schedule retention S3 export",
  },
  {
    label: "Automated Backups",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "automated backups enable disable schedule hourly daily weekly retention period days",
  },
  {
    label: "Backup",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "backup database backup now manual trigger run backup save copy",
  },
  {
    label: "Backup Schedule",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "backup schedule hourly daily weekly time automated",
  },
  {
    label: "Backup Retention Period",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "backup retention period days keep delete old backups storage",
  },
  {
    label: "Backup Destination",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "backup destination Amazon S3 local disk storage bucket",
  },
  {
    label: "S3 Bucket Configuration",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "S3 bucket AWS Amazon storage backup configuration name",
  },
  {
    label: "Export Full Database",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "export full database SQL download dump manual export",
  },
  {
    label: "Backup Now",
    subtitle: "Settings · Database",
    path: "/admin/settings",
    icon: P.save,
    keywords: "backup now manual backup trigger run immediately",
  },

  // ── Settings — Notifications tab ─────────────────────────────────────────
  {
    label: "Notification Settings",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.notif,
    keywords: "notification settings email SMS in-app alerts delivery channels",
  },
  {
    label: "Notifications",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.notif,
    keywords: "notifications configure channels alerts triggers email SMS in-app",
  },
  {
    label: "Email Notifications",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.mail,
    keywords: "email notifications enable disable alerts admin email",
  },
  {
    label: "SMS Notifications",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.notif,
    keywords: "SMS notifications enable disable Twilio Termii critical alerts",
  },
  {
    label: "In-App Notifications",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.notif,
    keywords: "in-app notifications bell dashboard alerts enable disable",
  },
  {
    label: "Alert Triggers",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.notif,
    keywords: "alert triggers new application disbursement repayment KYC login failure notifications",
  },
  {
    label: "SMTP Configuration",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.mail,
    keywords: "SMTP configuration host port username password from name email server setup",
  },
  {
    label: "Test Email",
    subtitle: "Settings · Notifications",
    path: "/admin/settings",
    icon: P.mail,
    keywords: "test email send SMTP test verify email configuration",
  },

  // ── Settings — Platform tab ───────────────────────────────────────────────
  {
    label: "Platform Settings",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "platform settings branding maintenance feature flags loan limits support contact",
  },
  {
    label: "Platform",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "platform configure branding name colour support contact maintenance flags",
  },
  {
    label: "Maintenance Mode",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.warn,
    keywords: "maintenance mode enable disable scheduled downtime parent school portal message",
  },
  {
    label: "Feature Flags",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "feature flags enable disable new loan applications disbursements emergency freeze toggle",
  },
  {
    label: "Accept New Loan Applications",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.applications,
    keywords: "accept new loan applications toggle feature flag pause stop enable",
  },
  {
    label: "Enable Disbursements",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.funding,
    keywords: "enable disbursements toggle payments freeze emergency stop feature",
  },
  {
    label: "Branding & Identity",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "branding identity platform name brand colour accent logo",
  },
  {
    label: "Brand Colour",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.settings,
    keywords: "brand accent colour hex color platform theme customise",
  },
  {
    label: "Support Contact",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.support,
    keywords: "support contact email phone platform help desk address",
  },
  {
    label: "Maximum Loan Amount",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.funding,
    keywords: "maximum loan amount cap limit per application naira",
  },
  {
    label: "Default Service Charge",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.funding,
    keywords: "default service charge percentage fee non-registered schools",
  },
  {
    label: "Danger Zone",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.warn,
    keywords: "danger zone purge audit logs reset settings factory defaults destructive",
  },
  {
    label: "Reset Settings to Defaults",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.warn,
    keywords: "reset settings defaults factory wipe configuration",
  },
  {
    label: "Purge Audit Logs",
    subtitle: "Settings · Platform",
    path: "/admin/settings",
    icon: P.warn,
    keywords: "purge audit logs delete clear all permanently",
  },

  // ── Settings — Audit tab ──────────────────────────────────────────────────
  {
    label: "Audit Settings",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.audit,
    keywords: "audit settings log retention what gets logged export",
  },
  {
    label: "Audit",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.audit,
    keywords: "audit tab settings retention log admin actions API exports",
  },
  {
    label: "Audit Log Retention",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.audit,
    keywords: "audit log retention period days keep store history",
  },
  {
    label: "Log Admin Actions",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.audit,
    keywords: "log admin actions create update delete user actions audit",
  },
  {
    label: "Log API Requests",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.audit,
    keywords: "log API requests HTTP calls endpoint audit trail",
  },
  {
    label: "Export Audit Logs (Settings)",
    subtitle: "Settings · Audit",
    path: "/admin/settings",
    icon: P.save,
    keywords: "export audit logs CSV download settings audit section",
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  {
    label: "My Profile",
    subtitle: "Admin",
    path: "/admin/profile",
    icon: P.profile,
    keywords: "profile personal info name email update password change account",
  },
];

// ─── CS search index ──────────────────────────────────────────────────────────

const CS_INDEX: SearchEntry[] = [
  {
    label: "Dashboard",
    subtitle: "Customer Service",
    path: "/cs/dashboard",
    icon: P.dashboard,
    keywords: "overview stats open tickets pending resolved metrics summary",
  },
  {
    label: "Manage Issues",
    subtitle: "Customer Service",
    path: "/cs/issues",
    icon: P.issues,
    keywords: "issues tickets support queue manage all open closed resolved assign",
  },
  {
    label: "Open Tickets",
    subtitle: "Customer Service · Issues",
    path: "/cs/issues",
    icon: P.issues,
    keywords: "open tickets unresolved pending support queue",
  },
  {
    label: "Closed Tickets",
    subtitle: "Customer Service · Issues",
    path: "/cs/issues",
    icon: P.issues,
    keywords: "closed resolved tickets history",
  },
  {
    label: "Assign Ticket",
    subtitle: "Customer Service · Issues",
    path: "/cs/issues",
    icon: P.issues,
    keywords: "assign ticket agent team member escalate manager",
  },
  {
    label: "All Applications",
    subtitle: "Customer Service · Applications",
    path: "/cs/applications",
    icon: P.applications,
    keywords: "applications loan student tuition list reference number status pending approved rejected",
  },
  {
    label: "All Schools",
    subtitle: "Customer Service · Schools",
    path: "/cs/schools",
    icon: P.schools,
    keywords: "schools list all partner institutions contact address status",
  },
  {
    label: "All Parents",
    subtitle: "Customer Service · Parents",
    path: "/cs/parents",
    icon: P.customers,
    keywords: "parents borrowers list all email phone kyc status",
  },
  {
    label: "Escalations",
    subtitle: "Customer Service",
    path: "/cs/escalations",
    icon: P.escalations,
    keywords: "escalated tickets escalations managers supervisor priority urgent",
  },
  {
    label: "Knowledge Base",
    subtitle: "Customer Service",
    path: "/cs/knowledge",
    icon: P.knowledge,
    keywords: "knowledge base articles FAQs guides help documentation how to answer",
  },
  {
    label: "Reports",
    subtitle: "Customer Service",
    path: "/cs/reports",
    icon: P.reports,
    keywords: "reports metrics performance resolution rate SLA charts statistics",
  },
  {
    label: "Profile",
    subtitle: "Account",
    path: "/cs/profile",
    icon: P.profile,
    keywords: "profile account settings personal info password update",
  },
];

// ─── Filter ───────────────────────────────────────────────────────────────────

// ─── School search index ──────────────────────────────────────────────────────

const SCHOOL_INDEX: SearchEntry[] = [
  {
    label: "Dashboard",
    subtitle: "School Portal",
    path: "/school/dashboard",
    icon: P.dashboard,
    keywords: "overview stats applications disbursements students summary metrics",
  },
  {
    label: "Students",
    subtitle: "School Portal",
    path: "/school/students",
    icon: P.customers,
    keywords: "students list manage all students grade level tuition enrollment add student",
  },
  {
    label: "Applications",
    subtitle: "School Portal",
    path: "/school/applications",
    icon: P.applications,
    keywords: "applications loan list all student applications status pending approved rejected disbursed reference",
  },
  {
    label: "Pending Applications",
    subtitle: "School Portal · Applications",
    path: "/school/applications",
    icon: P.applications,
    keywords: "pending applications awaiting review enrollment verification",
  },
  {
    label: "Enrollment Verification",
    subtitle: "School Portal · Applications",
    path: "/school/applications",
    icon: P.compliance,
    keywords: "enrollment verification confirm reject tuition amount student enrollment school verify",
  },
  {
    label: "Disbursement",
    subtitle: "School Portal",
    path: "/school/disbursement",
    icon: P.funding,
    keywords: "disbursement payments received money transfer bank account payout history",
  },
  {
    label: "Disbursement History",
    subtitle: "School Portal · Disbursement",
    path: "/school/disbursement",
    icon: P.funding,
    keywords: "disbursement history past payments released funds",
  },
  {
    label: "Verification Settings",
    subtitle: "School Portal",
    path: "/school/settings",
    icon: P.security,
    keywords: "verification settings school KYC documents CAC certificate registration verify",
  },
  {
    label: "Support",
    subtitle: "School Portal",
    path: "/school/support",
    icon: P.support,
    keywords: "support tickets help issues contact raise ticket customer service",
  },
  {
    label: "Open Support Ticket",
    subtitle: "School Portal · Support",
    path: "/school/support",
    icon: P.support,
    keywords: "open support ticket raise issue help request contact",
  },
  {
    label: "Account Settings",
    subtitle: "School Portal",
    path: "/school/account-settings",
    icon: P.settings,
    keywords: "account settings profile contact person phone bank details update password",
  },
  {
    label: "Bank Account Details",
    subtitle: "School Portal · Account Settings",
    path: "/school/account-settings",
    icon: P.funding,
    keywords: "bank account details account number name bank name update payment",
  },
  {
    label: "Profile Settings",
    subtitle: "School Portal · Account Settings",
    path: "/school/account-settings",
    icon: P.profile,
    keywords: "profile settings name address website contact update school information",
  },
];

// ─── Parent search index ──────────────────────────────────────────────────────

const PARENT_INDEX: SearchEntry[] = [
  {
    label: "Dashboard",
    subtitle: "Parent Portal",
    path: "/parent/dashboard",
    icon: P.dashboard,
    keywords: "overview summary active applications loan status payments",
  },
  {
    label: "My Applications",
    subtitle: "Parent Portal",
    path: "/parent/applications",
    icon: P.applications,
    keywords: "my applications loan list all applications reference status pending approved disbursed",
  },
  {
    label: "Repayment",
    subtitle: "Parent Portal",
    path: "/parent/repayment",
    icon: P.funding,
    keywords: "repayment payments history schedule outstanding balance pay loan",
  },
  {
    label: "Make Repayment",
    subtitle: "Parent Portal · Repayment",
    path: "/parent/repayment",
    icon: P.funding,
    keywords: "make repayment pay now outstanding loan balance",
  },
  {
    label: "Verification",
    subtitle: "Parent Portal",
    path: "/parent/verification",
    icon: P.security,
    keywords: "verification KYC identity NIN BVN income employment documents verify",
  },
  {
    label: "KYC Verification",
    subtitle: "Parent Portal · Verification",
    path: "/parent/verification",
    icon: P.compliance,
    keywords: "KYC verification identity document NIN BVN income employment submit verify approve",
  },
  {
    label: "Support",
    subtitle: "Parent Portal",
    path: "/parent/support",
    icon: P.support,
    keywords: "support help contact raise ticket issue customer service",
  },
  {
    label: "Settings",
    subtitle: "Parent Portal",
    path: "/parent/settings",
    icon: P.settings,
    keywords: "settings profile personal info name address phone update password change account employment",
  },
  {
    label: "Personal Information",
    subtitle: "Parent Portal · Settings",
    path: "/parent/settings",
    icon: P.profile,
    keywords: "personal information name date of birth address update profile",
  },
  {
    label: "Employment & Income",
    subtitle: "Parent Portal · Settings",
    path: "/parent/settings",
    icon: P.analytics,
    keywords: "employment income employer monthly salary job status update",
  },
  {
    label: "My Students",
    subtitle: "Parent Portal · Settings",
    path: "/parent/settings",
    icon: P.customers,
    keywords: "my students children manage add student grade school tuition",
  },
];

function getIndex(role: string | undefined): SearchEntry[] {
  if (role === "admin" || role === "super_admin") return ADMIN_INDEX;
  if (role === "customer_service" || role === "customer_service_manager") return CS_INDEX;
  if (role === "school") return SCHOOL_INDEX;
  if (role === "parent") return PARENT_INDEX;
  return [];
}

function filterEntries(entries: SearchEntry[], q: string): SearchEntry[] {
  const term = q.trim().toLowerCase();
  if (!term) return entries;
  // Score: label match scores higher than keyword match
  type Scored = { entry: SearchEntry; score: number };
  const scored: Scored[] = [];
  for (const e of entries) {
    const labelLow    = e.label.toLowerCase();
    const subtitleLow = e.subtitle.toLowerCase();
    const kwLow       = e.keywords.toLowerCase();
    if (labelLow.includes(term)) {
      scored.push({ entry: e, score: labelLow.startsWith(term) ? 3 : 2 });
    } else if (subtitleLow.includes(term) || kwLow.includes(term)) {
      scored.push({ entry: e, score: 1 });
    }
  }
  // Sort: highest score first, then original order
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry);
}

// ─── Tiny SVG helpers ─────────────────────────────────────────────────────────

const SearchIcon: React.FC<{ cls?: string }> = ({ cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EntryIcon: React.FC<{ d: string }> = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path d={d} />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const GlobalSearch: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef   = useRef<HTMLInputElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const itemRefs   = useRef<(HTMLButtonElement | null)[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const index    = getIndex(user?.role);
  const filtered = filterEntries(index, query);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const openModal = useCallback(() => {
    setQuery("");
    setActiveIdx(0);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  const select = useCallback(
    (path: string) => { navigate(path); closeModal(); },
    [navigate, closeModal],
  );

  // ── Ctrl+K global shortcut ──────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openModal();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openModal]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  // Reset active index + refs when list changes
  useEffect(() => {
    setActiveIdx(0);
    itemRefs.current = [];
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        closeModal();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeModal]);

  // ── Keyboard navigation inside modal ────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => Math.min(p + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[activeIdx]) select(filtered[activeIdx].path);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        aria-label="Open search (Ctrl+K)"
        aria-haspopup="dialog"
        className="flex items-center gap-2 w-56 lg:w-72 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-left hover:border-gray-300 hover:bg-gray-100 transition-colors"
      >
        <SearchIcon cls="w-4 h-4 text-gray-400 shrink-0" />
        <span className="flex-1 text-sm text-gray-400 truncate">
          Search loans, transactions, and more
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          <kbd className="px-1 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-300 rounded leading-none">CTRL</kbd>
          <kbd className="px-1 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-300 rounded leading-none">K</kbd>
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[999] flex items-start justify-center px-4"
          style={{ paddingTop: "10vh" }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            ref={panelRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[580px] overflow-hidden"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <SearchIcon cls="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search loans, transactions, and more"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                aria-label="Search"
                autoComplete="off"
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded leading-none">CTRL</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded leading-none">K</kbd>
              </div>
              <button
                onClick={closeModal}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              {filtered.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="py-2">
                  <p className="px-4 pt-1 pb-2 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    {query.trim() ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "Navigation"}
                  </p>
                  {filtered.map((entry, idx) => {
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={`${entry.path}-${entry.label}-${idx}`}
                        ref={(el) => { itemRefs.current[idx] = el; }}
                        type="button"
                        onClick={() => select(entry.path)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={isActive ? { backgroundColor: "rgba(122,14,66,0.06)" } : {}}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                          style={
                            isActive
                              ? { backgroundColor: BRAND, color: "white" }
                              : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                          }
                        >
                          <EntryIcon d={entry.icon} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {entry.label}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {entry.subtitle}
                          </p>
                        </div>
                        {isActive && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                               strokeLinecap="round" strokeLinejoin="round"
                               className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-semibold">↑</kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-semibold">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-semibold">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-semibold">ESC</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
