import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";

const BRAND = "#7A0E42";

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white " +
  "outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-colors";

const selectCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white " +
  "appearance-none cursor-pointer outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 transition-colors";

const Toggle: React.FC<{
  checked: boolean; onChange: (v: boolean) => void;
  label: string; description?: string; disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => (
  <div className="flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <button
      role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none disabled:opacity-40 mt-0.5"
      style={{ width: 42, height: 23, backgroundColor: checked ? BRAND : "#d1d5db" }}
    >
      <span className="absolute top-0.5 left-0.5 w-[19px] h-[19px] bg-white rounded-full shadow transition-transform duration-200"
            style={{ transform: checked ? "translateX(19px)" : "translateX(0)" }} />
    </button>
  </div>
);

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-6 items-start py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{hint}</p>}
    </div>
    <div>{children}</div>
  </div>
);

const SectionHead: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-5 first:mt-0">{label}</p>
);

const Btn: React.FC<{
  label: string; icon?: string | string[];
  variant?: "primary" | "outline" | "danger";
  onClick?: () => void; loading?: boolean;
}> = ({ label, icon, variant = "primary", onClick, loading }) => {
  const styles = {
    primary: { className: "text-white", style: { backgroundColor: BRAND } },
    outline: { className: "border border-gray-200 text-gray-700 hover:bg-gray-50", style: {} },
    danger:  { className: "border border-red-200 text-red-600 hover:bg-red-50", style: {} },
  }[variant];
  return (
    <button onClick={onClick} disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${styles.className}`}
            style={styles.style}>
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon && <Ic d={icon} cls="w-3.5 h-3.5" />}
      {label}
    </button>
  );
};


type TabId = "security" | "database" | "notifications" | "platform" | "audit";

const TABS: { id: TabId; label: string; icon: string | string[] }[] = [
  { id: "security",      label: "Security",      icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { id: "database",      label: "Database",      icon: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 8v4l3 3"] },
  { id: "notifications", label: "Notifications", icon: ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"] },
  { id: "platform",      label: "Platform",      icon: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
  { id: "audit",         label: "Audit",         icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
];

const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("security");
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [twoFa, setTwoFa]                   = useState(true);
  const [twoFaMethod, setTwoFaMethod]       = useState("totp");
  const [jwtExpiry, setJwtExpiry]           = useState("24");
  const [refreshExpiry, setRefreshExpiry]   = useState("30");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [maxAttempts, setMaxAttempts]       = useState("5");
  const [lockout, setLockout]               = useState("15");
  const [minPwLen, setMinPwLen]             = useState("8");
  const [reqUpper, setReqUpper]             = useState(true);
  const [reqNum, setReqNum]                 = useState(true);
  const [reqSym, setReqSym]                 = useState(true);
  const [ipWhitelist, setIpWhitelist]       = useState(false);
  const [ipList, setIpList]                 = useState("");
  const ROLES = ["super_admin", "admin", "risk_management", "accountant", "customer_service"];
  const [forcedRoles, setForcedRoles]       = useState<string[]>(["super_admin", "admin"]);
  const toggleRole = (r: string) => setForcedRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  const [backupEnabled, setBackupEnabled]     = useState(true);
  const [backupSchedule, setBackupSchedule]   = useState("daily");
  const [backupTime, setBackupTime]           = useState("02:00");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupDest, setBackupDest]           = useState("s3");
  const [s3Bucket, setS3Bucket]               = useState("skulcredit-backups");
  const [exporting, setExporting]             = useState(false);
  const [backingUp, setBackingUp]             = useState(false);

  const [emailNotifs, setEmailNotifs]   = useState(true);
  const [smsNotifs, setSmsNotifs]       = useState(false);
  const [inAppNotifs, setInAppNotifs]   = useState(true);
  const [alertApp, setAlertApp]         = useState(true);
  const [alertDisb, setAlertDisb]       = useState(true);
  const [alertRepay, setAlertRepay]     = useState(true);
  const [alertKyc, setAlertKyc]         = useState(true);
  const [alertLogin, setAlertLogin]     = useState(true);
  const [smtpHost, setSmtpHost]         = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort]         = useState("587");
  const [smtpUser, setSmtpUser]         = useState("noreply@skulcredit.com");
  const [smtpFrom, setSmtpFrom]         = useState("SkulCredit");
  const [smtpPass, setSmtpPass]         = useState("");
  const [testSending, setTestSending]   = useState(false);

  const [maintenance, setMaintenance]   = useState(false);
  const [maintMsg, setMaintMsg]         = useState("We are performing scheduled maintenance.");
  const [newAppsOn, setNewAppsOn]       = useState(true);
  const [disbOn, setDisbOn]             = useState(true);
  const [platformName, setPlatformName] = useState("SkulCredit");
  const [brand, setBrand]               = useState("#7A0E42");
  const [supportEmail, setSupportEmail] = useState("support@skulcredit.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 000 0000");
  const [maxLoan, setMaxLoan]           = useState("5000000");
  const [defCharge, setDefCharge]       = useState("23.5");

  const [auditRetention, setAuditRetention] = useState("365");
  const [logAdmin, setLogAdmin]             = useState(true);
  const [logApi, setLogApi]                 = useState(false);
  const [logExports, setLogExports]         = useState(true);
  const [auditExporting, setAuditExporting] = useState(false);

  useEffect(() => {
    apiClient.get("/admin/settings")
      .then((resp) => {
        const d = (resp.data as any).data ?? {};

        const sec = d.security ?? {};
        if (sec.twoFa !== undefined) setTwoFa(sec.twoFa);
        if (sec.twoFaMethod !== undefined) setTwoFaMethod(sec.twoFaMethod);
        if (sec.jwtExpiry !== undefined) setJwtExpiry(sec.jwtExpiry);
        if (sec.refreshExpiry !== undefined) setRefreshExpiry(sec.refreshExpiry);
        if (sec.sessionTimeout !== undefined) setSessionTimeout(sec.sessionTimeout);
        if (sec.maxAttempts !== undefined) setMaxAttempts(sec.maxAttempts);
        if (sec.lockout !== undefined) setLockout(sec.lockout);
        if (sec.minPwLen !== undefined) setMinPwLen(sec.minPwLen);
        if (sec.reqUpper !== undefined) setReqUpper(sec.reqUpper);
        if (sec.reqNum !== undefined) setReqNum(sec.reqNum);
        if (sec.reqSym !== undefined) setReqSym(sec.reqSym);
        if (sec.ipWhitelist !== undefined) setIpWhitelist(sec.ipWhitelist);
        if (sec.ipList !== undefined) setIpList(sec.ipList);
        if (sec.forcedRoles !== undefined) setForcedRoles(sec.forcedRoles);

        const db = d.database ?? {};
        if (db.backupEnabled !== undefined) setBackupEnabled(db.backupEnabled);
        if (db.backupSchedule !== undefined) setBackupSchedule(db.backupSchedule);
        if (db.backupTime !== undefined) setBackupTime(db.backupTime);
        if (db.backupRetention !== undefined) setBackupRetention(db.backupRetention);
        if (db.backupDest !== undefined) setBackupDest(db.backupDest);
        if (db.s3Bucket !== undefined) setS3Bucket(db.s3Bucket);

        const notif = d.notifications ?? {};
        if (notif.emailNotifs !== undefined) setEmailNotifs(notif.emailNotifs);
        if (notif.smsNotifs !== undefined) setSmsNotifs(notif.smsNotifs);
        if (notif.inAppNotifs !== undefined) setInAppNotifs(notif.inAppNotifs);
        if (notif.alertApp !== undefined) setAlertApp(notif.alertApp);
        if (notif.alertDisb !== undefined) setAlertDisb(notif.alertDisb);
        if (notif.alertRepay !== undefined) setAlertRepay(notif.alertRepay);
        if (notif.alertKyc !== undefined) setAlertKyc(notif.alertKyc);
        if (notif.alertLogin !== undefined) setAlertLogin(notif.alertLogin);
        if (notif.smtpHost !== undefined) setSmtpHost(notif.smtpHost);
        if (notif.smtpPort !== undefined) setSmtpPort(notif.smtpPort);
        if (notif.smtpUser !== undefined) setSmtpUser(notif.smtpUser);
        if (notif.smtpFrom !== undefined) setSmtpFrom(notif.smtpFrom);
        if (notif.smtpPass !== undefined) setSmtpPass(notif.smtpPass);

        const plat = d.platform ?? {};
        if (plat.maintenance !== undefined) setMaintenance(plat.maintenance);
        if (plat.maintMsg !== undefined) setMaintMsg(plat.maintMsg);
        if (plat.newAppsOn !== undefined) setNewAppsOn(plat.newAppsOn);
        if (plat.disbOn !== undefined) setDisbOn(plat.disbOn);
        if (plat.platformName !== undefined) setPlatformName(plat.platformName);
        if (plat.brand !== undefined) setBrand(plat.brand);
        if (plat.supportEmail !== undefined) setSupportEmail(plat.supportEmail);
        if (plat.supportPhone !== undefined) setSupportPhone(plat.supportPhone);
        if (plat.maxLoan !== undefined) setMaxLoan(plat.maxLoan);
        if (plat.defCharge !== undefined) setDefCharge(plat.defCharge);

        const aud = d.audit ?? {};
        if (aud.auditRetention !== undefined) setAuditRetention(aud.auditRetention);
        if (aud.logAdmin !== undefined) setLogAdmin(aud.logAdmin);
        if (aud.logApi !== undefined) setLogApi(aud.logApi);
        if (aud.logExports !== undefined) setLogExports(aud.logExports);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (section: string) => {
    setSaving(section);
    try {
      const sectionKey = section.toLowerCase();
      const bodyMap: Record<string, unknown> = {
        security: { twoFa, twoFaMethod, jwtExpiry, refreshExpiry, sessionTimeout, maxAttempts, lockout, minPwLen, reqUpper, reqNum, reqSym, ipWhitelist, ipList, forcedRoles },
        database: { backupEnabled, backupSchedule, backupTime, backupRetention, backupDest, s3Bucket },
        notifications: { emailNotifs, smsNotifs, inAppNotifs, alertApp, alertDisb, alertRepay, alertKyc, alertLogin, smtpHost, smtpPort, smtpUser, smtpFrom, smtpPass },
        platform: { maintenance, maintMsg, newAppsOn, disbOn, platformName, brand, supportEmail, supportPhone, maxLoan, defCharge },
        audit: { auditRetention, logAdmin, logApi, logExports },
      };
      await apiClient.put(`/admin/settings/${sectionKey}`, bodyMap[sectionKey]);
      toastSuccess(`${section} settings saved.`);
    } catch {
      toastError(`Failed to save ${section} settings.`);
    } finally {
      setSaving(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await apiClient.post("/admin/settings/database/export", {}, { responseType: "blob" });
      const url = URL.createObjectURL(resp.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skulcredit.sql";
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Database exported successfully.");
    } catch {
      toastError("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const resp = await apiClient.post("/admin/settings/database/backup", {});
      const { filename, size } = (resp.data as any).data;
      toastSuccess(`Backup saved: ${filename} (${(size / 1024).toFixed(1)} KB)`);
    } catch {
      toastError("Backup failed.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleTestEmail = async () => {
    setTestSending(true);
    try {
      await apiClient.post("/admin/settings/notifications/test-email", {
        smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPass,
        fromName: smtpFrom, toEmail: smtpUser,
      });
      toastSuccess(`Test email sent to ${smtpUser}.`);
    } catch {
      toastError("Test email failed.");
    } finally {
      setTestSending(false);
    }
  };

  const handleAuditExport = async () => {
    setAuditExporting(true);
    try {
      const resp = await apiClient.get("/admin/settings/audit/export", { responseType: "blob" });
      const url = URL.createObjectURL(resp.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Audit log exported.");
    } catch {
      toastError("Audit export failed.");
    } finally {
      setAuditExporting(false);
    }
  };

  const SaveBar: React.FC<{ section: string }> = ({ section }) => (
    <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
      <Btn label={saving === section ? "Saving…" : "Save Changes"} loading={saving === section}
           icon="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"
           onClick={() => save(section)} />
    </div>
  );

  const panels: Record<TabId, React.ReactNode> = {

    security: (
      <div className="space-y-0">
        <SectionHead label="Two-Factor Authentication" />
        <Toggle checked={twoFa} onChange={setTwoFa} label="Enable 2FA for all admin accounts"
                description="Users will be required to complete a second factor on every login." />
        {twoFa && (
          <>
            <Row label="2FA Method">
              <select value={twoFaMethod} onChange={e => setTwoFaMethod(e.target.value)} className={selectCls}>
                <option value="totp">Authenticator App (TOTP)</option>
                <option value="email">Email OTP</option>
                <option value="sms">SMS OTP</option>
              </select>
            </Row>
            <Row label="Enforce 2FA for roles" hint="Click to toggle individual roles">
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} onClick={() => toggleRole(r)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            forcedRoles.includes(r)
                              ? "bg-[#7A0E42]/8 border-[#7A0E42] text-[#7A0E42]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}>
                    {r.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </Row>
          </>
        )}

        <SectionHead label="Token & Session" />
        <Row label="JWT Access Token Expiry" hint="Hours before users must re-authenticate">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" min="1" max="168" value={jwtExpiry} onChange={e => setJwtExpiry(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">hours</span>
          </div>
        </Row>
        <Row label="Refresh Token Expiry" hint="Days until re-login required">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" min="1" max="365" value={refreshExpiry} onChange={e => setRefreshExpiry(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">days</span>
          </div>
        </Row>
        <Row label="Idle Session Timeout" hint="Auto-logout after inactivity">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" min="5" max="480" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">minutes</span>
          </div>
        </Row>

        <SectionHead label="Login Security" />
        <Row label="Max Failed Login Attempts">
          <input type="number" min="1" max="20" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} className={inputCls + " max-w-[120px]"} />
        </Row>
        <Row label="Lockout Duration">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" min="1" max="1440" value={lockout} onChange={e => setLockout(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">minutes</span>
          </div>
        </Row>

        <SectionHead label="Password Policy" />
        <Row label="Minimum Length">
          <input type="number" min="6" max="32" value={minPwLen} onChange={e => setMinPwLen(e.target.value)} className={inputCls + " max-w-[120px]"} />
        </Row>
        <Toggle checked={reqUpper} onChange={setReqUpper} label="Require uppercase letter" />
        <Toggle checked={reqNum}   onChange={setReqNum}   label="Require at least one number" />
        <Toggle checked={reqSym}   onChange={setReqSym}   label="Require at least one symbol" />

        <SectionHead label="IP Allowlist" />
        <Toggle checked={ipWhitelist} onChange={setIpWhitelist} label="Enable IP Allowlist"
                description="Only allow admin logins from listed IP addresses." />
        {ipWhitelist && (
          <Row label="Allowed IPs" hint="Comma-separated IPv4/IPv6 or CIDR ranges">
            <textarea value={ipList} onChange={e => setIpList(e.target.value)} rows={2}
                      placeholder="e.g. 192.168.1.0/24, 41.58.0.1" className={inputCls + " resize-none"} />
          </Row>
        )}

        <SaveBar section="Security" />
      </div>
    ),

    database: (
      <div className="space-y-0">
        <SectionHead label="Automated Backups" />
        <Toggle checked={backupEnabled} onChange={setBackupEnabled} label="Enable Automated Backups"
                description="Regularly back up the full database to your configured destination." />
        {backupEnabled && (
          <>
            <Row label="Schedule">
              <select value={backupSchedule} onChange={e => setBackupSchedule(e.target.value)} className={selectCls + " max-w-[200px]"}>
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Sunday)</option>
              </select>
            </Row>
            {backupSchedule !== "hourly" && (
              <Row label="Backup Time" hint="Server local time (24h)">
                <input type="time" value={backupTime} onChange={e => setBackupTime(e.target.value)} className={inputCls + " max-w-[140px]"} />
              </Row>
            )}
            <Row label="Retention Period">
              <div className="flex items-center gap-2 max-w-[160px]">
                <input type="number" min="1" max="365" value={backupRetention} onChange={e => setBackupRetention(e.target.value)} className={inputCls} />
                <span className="text-sm text-gray-400 shrink-0">days</span>
              </div>
            </Row>
            <Row label="Destination">
              <select value={backupDest} onChange={e => setBackupDest(e.target.value)} className={selectCls + " max-w-[200px]"}>
                <option value="s3">Amazon S3</option>
                <option value="local">Local Disk</option>
                <option value="both">S3 + Local</option>
              </select>
            </Row>
            {(backupDest === "s3" || backupDest === "both") && (
              <Row label="S3 Bucket Name">
                <input value={s3Bucket} onChange={e => setS3Bucket(e.target.value)} className={inputCls + " max-w-[280px]"} />
              </Row>
            )}
          </>
        )}

        <SectionHead label="Manual Actions" />
        <div className="flex flex-wrap gap-3 py-3">
          <Btn label={backingUp ? "Running…" : "Backup Now"} loading={backingUp}
               icon={["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"]}
               onClick={handleBackup} />
          <Btn label={exporting ? "Preparing…" : "Export Full Database"} loading={exporting}
               icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
               variant="outline" onClick={handleExport} />
        </div>

        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mt-2">
          <Ic d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" cls="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Last backup:</strong> Today at 02:00 AM &nbsp;·&nbsp;
            Exports are sent as a secure download link to the admin email on file.
          </p>
        </div>

        <SaveBar section="Database" />
      </div>
    ),

    notifications: (
      <div className="space-y-0">
        <SectionHead label="Delivery Channels" />
        <Toggle checked={emailNotifs} onChange={setEmailNotifs} label="Email Notifications" description="Send alerts to configured admin email addresses." />
        <Toggle checked={smsNotifs}   onChange={setSmsNotifs}   label="SMS Notifications"   description="Send critical alerts via SMS (requires Twilio/Termii config)." />
        <Toggle checked={inAppNotifs} onChange={setInAppNotifs} label="In-App Notifications" description="Show bell alerts inside the admin dashboard." />

        <SectionHead label="Alert Triggers" />
        <Toggle checked={alertApp}   onChange={setAlertApp}   label="New Loan Application Submitted" />
        <Toggle checked={alertDisb}  onChange={setAlertDisb}  label="Disbursement Processed or Failed" />
        <Toggle checked={alertRepay} onChange={setAlertRepay} label="Repayment Received or Overdue" />
        <Toggle checked={alertKyc}   onChange={setAlertKyc}   label="KYC Submission / Approval / Rejection" />
        <Toggle checked={alertLogin} onChange={setAlertLogin} label="Repeated Failed Login Attempts" />

        <SectionHead label="SMTP Configuration" />
        <Row label="Host">
          <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>
        <Row label="Port">
          <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className={inputCls + " max-w-[100px]"} />
        </Row>
        <Row label="Username / Email">
          <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>
        <Row label="Password">
          <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="••••••••••••" className={inputCls + " max-w-sm"} />
        </Row>
        <Row label="From Name">
          <input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>
        <div className="flex items-center gap-3 pt-2">
          <Btn label={testSending ? "Sending…" : "Send Test Email"} loading={testSending}
               icon="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5"
               variant="outline" onClick={handleTestEmail} />
        </div>

        <SaveBar section="Notifications" />
      </div>
    ),

    platform: (
      <div className="space-y-0">
        <SectionHead label="Maintenance" />
        <Toggle checked={maintenance} onChange={setMaintenance} label="Maintenance Mode"
                description="Parent and school portals show a maintenance page. Admin access unaffected." />
        {maintenance && (
          <Row label="Maintenance Message" hint="Shown to users on the maintenance page">
            <textarea rows={2} value={maintMsg} onChange={e => setMaintMsg(e.target.value)}
                      className={inputCls + " resize-none"} />
          </Row>
        )}

        <SectionHead label="Feature Flags" />
        <Toggle checked={newAppsOn} onChange={setNewAppsOn} label="Accept New Loan Applications"
                description="Toggle off to pause the platform from accepting new applications." />
        <Toggle checked={disbOn} onChange={setDisbOn} label="Enable Disbursements"
                description="Toggle off to pause all outgoing payments (emergency freeze)." />

        <SectionHead label="Branding & Identity" />
        <Row label="Platform Name">
          <input value={platformName} onChange={e => setPlatformName(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>
        <Row label="Brand Accent Colour" hint="HEX colour used across the platform">
          <div className="flex items-center gap-2 max-w-sm">
            <span className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: brand }} />
            <input value={brand} onChange={e => setBrand(e.target.value)} maxLength={7} className={inputCls} />
          </div>
        </Row>

        <SectionHead label="Support Contact" />
        <Row label="Support Email">
          <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>
        <Row label="Support Phone">
          <input type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className={inputCls + " max-w-sm"} />
        </Row>

        <SectionHead label="Loan Limits" />
        <Row label="Maximum Loan Amount (₦)" hint="Hard cap per application">
          <input type="number" value={maxLoan} onChange={e => setMaxLoan(e.target.value)} className={inputCls + " max-w-[200px]"} />
        </Row>
        <Row label="Default Service Charge" hint="Applied to non-registered schools">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" step="0.5" min="0" max="100" value={defCharge} onChange={e => setDefCharge(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">%</span>
          </div>
        </Row>

        <SaveBar section="Platform" />

        <div className="mt-6 rounded-xl border border-red-100 bg-red-50/40 overflow-hidden">
          <p className="px-4 py-2.5 text-xs font-bold text-red-500 uppercase tracking-widest border-b border-red-100">Danger Zone</p>
          <div className="px-4 py-4 space-y-3">
            {[
              { label: "Purge All Audit Logs", desc: "Permanently delete all audit log entries." },
              { label: "Reset Settings to Defaults", desc: "Wipes all settings back to factory defaults." },
            ].map(a => (
              <div key={a.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-700">{a.label}</p>
                  <p className="text-xs text-red-400">{a.desc}</p>
                </div>
                <Btn label={a.label.split(" ")[0]} variant="danger"
                     icon="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
                     onClick={() => toastError(`${a.label} is disabled in this environment.`)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    audit: (
      <div className="space-y-0">
        <SectionHead label="What Gets Logged" />
        <Toggle checked={logAdmin}   onChange={setLogAdmin}   label="Log Admin Actions"
                description="Record every create/update/delete action by admin users." />
        <Toggle checked={logApi}     onChange={setLogApi}     label="Log All API Calls"
                description="Verbose mode — records every inbound request. Increases storage usage." />
        <Toggle checked={logExports} onChange={setLogExports} label="Log Data Export Events"
                description="Record when admins export data or trigger database backups." />

        <SectionHead label="Retention" />
        <Row label="Log Retention Period" hint="Entries older than this are purged automatically">
          <div className="flex items-center gap-2 max-w-[160px]">
            <input type="number" min="30" max="3650" value={auditRetention} onChange={e => setAuditRetention(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-400 shrink-0">days</span>
          </div>
        </Row>

        <SectionHead label="Export" />
        <div className="py-3 flex flex-wrap gap-3">
          <Btn label={auditExporting ? "Exporting…" : "Export Audit Log (CSV)"} loading={auditExporting}
               icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
               variant="outline" onClick={handleAuditExport} />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2.5 mt-2">
          <Ic d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" cls="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Audit logs are append-only and cannot be edited. Export contains all entries within the retention window.
            Purging is restricted to super-admin and irreversible.
          </p>
        </div>

        <SaveBar section="Audit" />
      </div>
    ),
  };

  const activeTabDef = TABS.find(t => t.id === activeTab)!;

  return (
    <>
      <div className="max-w-[860px] mx-auto py-6 sm:py-8 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure security, database, notifications and platform behaviour.
          </p>
        </div>

        <div className="flex items-stretch gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex-1 justify-center",
                  isActive
                    ? "bg-white text-[#7A0E42] shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50",
                ].join(" ")}
              >
                <Ic d={tab.icon} cls="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                 style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
              <Ic d={activeTabDef.icon} cls="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{activeTabDef.label} Settings</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {{
                  security:      "Authentication, tokens, passwords and IP access control.",
                  database:      "Automated backups, retention policy and manual exports.",
                  notifications: "Alert channels, triggers and email delivery configuration.",
                  platform:      "Maintenance mode, feature flags, branding and loan limits.",
                  audit:         "Logging scope, retention period and log export.",
                }[activeTab]}
              </p>
            </div>
          </div>

          <div className="px-6 py-4">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <span className="w-8 h-8 border-4 border-[#7A0E42] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              panels[activeTab]
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminSettingsPage;
