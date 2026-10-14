import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND, PAGE_SIZES, fmtDate, useDebounce,
  SearchIcon, ChevronDown, ResetIcon, Spinner, EmptyRow, ErrorRow, Pagination, Ic,
} from "./components/shared";

type ActorRole    = "admin" | "parent" | "school" | "system" | "funding_partner";
type EventStatus  = "SUCCESS" | "FAILED" | "DENIED" | "REJECTED" | "PENDING" | "STARTED" | "COMPLETED" | "CANCELLED";
type Severity     = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
type AuditCategory =
  | "AUTHENTICATION" | "AUTHORIZATION" | "USER"        | "ADMIN"
  | "NAVIGATION"     | "API"           | "PAYMENT"     | "TRANSACTION"
  | "WALLET"         | "TRANSFER"      | "KYC"         | "SECURITY"
  | "CONFIGURATION"  | "DATABASE"      | "SYSTEM"      | "INTEGRATION"
  | "NOTIFICATION"   | "FILE"          | "REPORT"      | "BACKGROUND_JOB"
  | "SCHEDULED_TASK";

interface AuditLog {
  id: string;
  category: AuditCategory;
  action: string;
  eventStatus: EventStatus;
  severity: Severity;
  actorId: string | null;
  actorRole: ActorRole;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  ipAddress: string | null;
  requestId: string | null;
  correlationId: string | null;
  traceId: string | null;
  entityType: string | null;
  entityId: string | null;
  event: { category: string; action: string; type: string; status: string; severity: string; message: string };
  actor: { type: string; id: string | null; name: string | null; email: string | null; role: ActorRole };
  request: { requestId: string | null; correlationId: string | null; traceId: string | null; method: string; path: string; ipAddress: string | null; userAgent: string | null; channel: string };
  location: { country: string | null; state: string | null; city: string | null; timezone: string | null } | null;
  application: { service: string; module: string; version: string; environment: string; server: string | null };
  resource: { type: string | null; id: string | null } | null;
  navigation: { page: string | null; previousPage: string | null } | null;
  response: { statusCode: number; status: string; durationMs: number | null };
  error: { code: string | null; type: string | null; message: string | null; exception: string | null; stackTrace: string | null; retryable: boolean } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface PageMeta { total: number; page: number; limit: number; }

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? "akpeledavid@hotmail.com";

const ROLE_CFG: Record<string, { bg: string; text: string }> = {
  admin:           { bg: "bg-[#7A0E42]/10", text: "text-[#7A0E42]"  },
  parent:          { bg: "bg-blue-50",      text: "text-blue-700"    },
  school:          { bg: "bg-purple-50",    text: "text-purple-700"  },
  system:          { bg: "bg-gray-100",     text: "text-gray-500"    },
  funding_partner: { bg: "bg-teal-50",      text: "text-teal-700"    },
};

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  SUCCESS:   { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  FAILED:    { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
  DENIED:    { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400" },
  REJECTED:  { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400"    },
  PENDING:   { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400"  },
  STARTED:   { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400"   },
  COMPLETED: { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  CANCELLED: { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400"   },
};

const SEV_CFG: Record<string, { bg: string; text: string }> = {
  DEBUG:    { bg: "bg-gray-100",   text: "text-gray-500"   },
  INFO:     { bg: "bg-blue-50",    text: "text-blue-600"   },
  WARNING:  { bg: "bg-amber-50",   text: "text-amber-600"  },
  ERROR:    { bg: "bg-red-50",     text: "text-red-600"    },
  CRITICAL: { bg: "bg-red-100",    text: "text-red-800"    },
};

const METHOD_CFG: Record<string, string> = {
  GET:    "text-blue-600 bg-blue-50",
  POST:   "text-green-700 bg-green-50",
  PUT:    "text-amber-700 bg-amber-50",
  PATCH:  "text-amber-600 bg-amber-50",
  DELETE: "text-red-600 bg-red-50",
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const c = ROLE_CFG[role] ?? ROLE_CFG.system;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.text}`}>
      {role.replace("_", " ")}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {status}
    </span>
  );
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const c = SEV_CFG[severity] ?? SEV_CFG.INFO;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      {severity}
    </span>
  );
};

const MethodBadge: React.FC<{ method: string | null }> = ({ method }) => {
  if (!method) return <span className="text-gray-300 text-xs">—</span>;
  const cls = METHOD_CFG[method.toUpperCase()] ?? "text-gray-600 bg-gray-100";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${cls}`}>
      {method.toUpperCase()}
    </span>
  );
};

const LogDetailDrawer: React.FC<{ log: AuditLog | null; onClose: () => void }> = ({ log, onClose }) => {
  useEffect(() => {
    if (!log) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [log, onClose]);

  if (!log) return null;

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl overflow-hidden divide-y divide-gray-100">{children}</div>
    </div>
  );

  const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-medium text-gray-800 break-all min-w-0 flex-1">
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-0 right-0 h-full w-full max-w-[560px] bg-white z-50 shadow-2xl flex flex-col" role="dialog" aria-label="Audit log detail">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Audit Log Detail</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{log.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100" aria-label="Close">
            <Ic d="M18 6L6 18M6 6l12 12" cls="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={log.eventStatus} />
            <SeverityBadge severity={log.severity} />
            <RoleBadge role={log.actorRole} />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
              {log.category}
            </span>
          </div>

          {/* Event */}
          <Section title="Event">
            <Row label="Action"    value={<span className="font-mono font-bold text-gray-900">{log.action}</span>} />
            <Row label="Type"      value={log.event.type} />
            <Row label="Message"   value={log.event.message} />
          </Section>

          {/* Actor */}
          <Section title="Actor">
            <Row label="ID"    value={log.actor.id    ? <span className="font-mono">{log.actor.id}</span>    : null} />
            <Row label="Name"  value={log.actor.name  ?? null} />
            <Row label="Email" value={log.actor.email ?? null} />
            <Row label="Role"  value={<RoleBadge role={log.actorRole} />} />
          </Section>

          {/* Request */}
          <Section title="Request">
            <Row label="Method"        value={<MethodBadge method={log.method} />} />
            <Row label="Path"          value={<span className="font-mono text-[11px] break-all">{log.path}</span>} />
            <Row label="IP Address"    value={log.ipAddress} />
            <Row label="Channel"       value={log.request.channel} />
            <Row label="Request ID"    value={log.requestId    ? <span className="font-mono">{log.requestId}</span>    : null} />
            <Row label="Correlation"   value={log.correlationId ? <span className="font-mono">{log.correlationId}</span> : null} />
            <Row label="Trace ID"      value={log.traceId      ? <span className="font-mono">{log.traceId}</span>      : null} />
            <Row label="User Agent"    value={log.request.userAgent ? <span className="font-mono text-[10px] break-all">{log.request.userAgent}</span> : null} />
          </Section>

          {/* Location */}
          {log.location && (
            <Section title="Location">
              <Row label="Country"  value={log.location.country} />
              <Row label="State"    value={log.location.state} />
              <Row label="City"     value={log.location.city} />
              <Row label="Timezone" value={log.location.timezone} />
            </Section>
          )}

          {/* Application */}
          <Section title="Application">
            <Row label="Service"     value={log.application.service} />
            <Row label="Module"      value={log.application.module} />
            <Row label="Version"     value={log.application.version} />
            <Row label="Environment" value={log.application.environment} />
            <Row label="Server"      value={log.application.server} />
          </Section>

          {/* Resource */}
          {log.resource && (
            <Section title="Resource">
              <Row label="Type" value={log.resource.type} />
              <Row label="ID"   value={log.resource.id ? <span className="font-mono">{log.resource.id}</span> : null} />
            </Section>
          )}

          {/* Response */}
          <Section title="Response">
            <Row label="Status Code" value={<span className={`font-mono font-bold ${log.response.statusCode >= 500 ? "text-red-600" : log.response.statusCode >= 400 ? "text-amber-600" : "text-green-700"}`}>{log.response.statusCode}</span>} />
            <Row label="Status"      value={<StatusBadge status={log.response.status} />} />
            <Row label="Duration"    value={log.response.durationMs != null ? `${log.response.durationMs} ms` : null} />
          </Section>

          {/* Error */}
          {log.error && (
            <Section title="Error">
              <Row label="Code"      value={log.error.code} />
              <Row label="Type"      value={log.error.type} />
              <Row label="Message"   value={log.error.message} />
              <Row label="Exception" value={log.error.exception} />
              <Row label="Retryable" value={log.error.retryable ? "Yes" : "No"} />
              {log.error.stackTrace && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Stack Trace</p>
                  <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap break-all bg-white rounded-lg p-2 border border-gray-100 max-h-40 overflow-y-auto">{log.error.stackTrace}</pre>
                </div>
              )}
            </Section>
          )}

          {/* Timestamps */}
          <Section title="Timestamp">
            <Row label="Created At" value={new Date(log.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "medium" })} />
          </Section>

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
};

const ROLE_OPTIONS = [
  { label: "All Roles",  value: "" },
  { label: "Admin",      value: "admin"  },
  { label: "Parent",     value: "parent" },
  { label: "School",     value: "school" },
  { label: "System",     value: "system" },
];

const STATUS_OPTIONS = [
  { label: "All Status",  value: "" },
  { label: "Success",     value: "SUCCESS"   },
  { label: "Failed",      value: "FAILED"    },
  { label: "Denied",      value: "DENIED"    },
  { label: "Rejected",    value: "REJECTED"  },
  { label: "Pending",     value: "PENDING"   },
];

const SEVERITY_OPTIONS = [
  { label: "All Severity", value: "" },
  { label: "Info",         value: "INFO"     },
  { label: "Warning",      value: "WARNING"  },
  { label: "Error",        value: "ERROR"    },
  { label: "Critical",     value: "CRITICAL" },
  { label: "Debug",        value: "DEBUG"    },
];

const METHOD_OPTIONS = [
  { label: "All Methods", value: "" },
  { label: "GET",    value: "GET"    },
  { label: "POST",   value: "POST"   },
  { label: "PUT",    value: "PUT"    },
  { label: "PATCH",  value: "PATCH"  },
  { label: "DELETE", value: "DELETE" },
];

const COLS = ["TIMESTAMP", "METHOD", "PATH", "ACTION", "STATUS", "SEVERITY", "ACTOR", "ROLE", "IP ADDRESS", "DURATION", "ACTIONS"];

const AdminAuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const [search,         setSearch]         = useState("");
  const [roleFilter,     setRoleFilter]     = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [methodFilter,   setMethodFilter]   = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [page,           setPage]           = useState(1);
  const [limit,          setLimit]          = useState(10);   // default 10

  const [rows,     setRows]     = useState<AuditLog[]>([]);
  const [meta,     setMeta]     = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("action",      debouncedSearch);
      if (roleFilter)      params.set("actorRole",   roleFilter);
      if (statusFilter)    params.set("eventStatus", statusFilter);
      if (severityFilter)  params.set("severity",    severityFilter);
      if (methodFilter)    params.set("method",      methodFilter);
      if (dateFrom)        params.set("fromDate",    dateFrom);
      if (dateTo)          params.set("toDate",      dateTo + "T23:59:59");
      params.set("page",  String(page));
      params.set("limit", String(limit));

      const res = await apiClient.get<{
        data: { total: number; page: number; limit: number; data: AuditLog[] };
      }>(`/admin/audit-logs?${params}`);
      setRows(res.data.data.data);
      setMeta({ total: res.data.data.total, page: res.data.data.page, limit: res.data.data.limit });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, severityFilter, methodFilter, dateFrom, dateTo, page, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, statusFilter, severityFilter, methodFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/audit-logs/${deleteId}`);
      toastSuccess("Audit log deleted.");
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isSuperAdmin) {
      toastError("Unauthorized — only the super admin can delete audit logs.");
      return;
    }
    setDeleteId(id);
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));
  const hasFilters = !!(search || roleFilter || statusFilter || severityFilter || methodFilter || dateFrom || dateTo);

  const resetFilters = () => {
    setSearch(""); setRoleFilter(""); setStatusFilter("");
    setSeverityFilter(""); setMethodFilter(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const truncatePath = (p: string | null, len = 45) =>
    p && p.length > len ? p.slice(0, len) + "…" : p;

  return (
    <>
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
             role="dialog" aria-modal="true"
             onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-900">Delete Audit Log?</h2>
            <p className="mt-2 text-sm text-gray-500">This record will be permanently removed and cannot be recovered.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleteLoading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleteLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <LogDetailDrawer log={selected} onClose={() => setSelected(null)} />

      <div className="max-w-[1400px] mx-auto py-6 sm:py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-1">
              Immutable record of all system activity · {meta.total.toLocaleString()} events
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <Ic d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" cls="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">
              {isSuperAdmin ? "Super admin — delete enabled" : "Read-only · delete requires super admin"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by action…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" />
          </div>

          {/* Dropdowns */}
          {[
            { value: roleFilter,     setter: setRoleFilter,     opts: ROLE_OPTIONS     },
            { value: statusFilter,   setter: setStatusFilter,   opts: STATUS_OPTIONS   },
            { value: severityFilter, setter: setSeverityFilter, opts: SEVERITY_OPTIONS },
            { value: methodFilter,   setter: setMethodFilter,   opts: METHOD_OPTIONS   },
          ].map(({ value, setter, opts }, i) => (
            <div key={i} className="relative">
              <select value={value} onChange={e => setter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer">
                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
            </div>
          ))}

          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer" />
          <input type="date" value={dateTo} min={dateFrom} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer" />

          <div className="relative">
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer">
              {[10, 25, 50, 500].map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors">
              <ResetIcon /> Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div
            className="overflow-x-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: `${BRAND}40 transparent`,
            }}
          >
            <style>{`
              .audit-scroll::-webkit-scrollbar { height: 4px; }
              .audit-scroll::-webkit-scrollbar-track { background: transparent; }
              .audit-scroll::-webkit-scrollbar-thumb { background: ${BRAND}55; border-radius: 999px; }
              .audit-scroll::-webkit-scrollbar-thumb:hover { background: ${BRAND}; }
            `}</style>
            <div className="audit-scroll overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "1100px" }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {COLS.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? <Spinner cols={COLS.length} /> :
                   error   ? <ErrorRow cols={COLS.length} message={error} /> :
                   rows.length === 0 ? <EmptyRow cols={COLS.length} label="No audit events found." /> :
                   rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-700 font-medium">{fmtDate(row.createdAt)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {new Date(row.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MethodBadge method={row.method} />
                      </td>

                      {/* Path */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <span className="text-[11px] font-mono text-gray-600 break-all line-clamp-2" title={row.path ?? ""}>
                          {truncatePath(row.path)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-mono font-bold text-gray-800">{row.action}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{row.category}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={row.eventStatus} />
                        {row.statusCode && (
                          <p className={`text-[10px] font-mono mt-0.5 ${row.statusCode >= 500 ? "text-red-500" : row.statusCode >= 400 ? "text-amber-500" : "text-gray-400"}`}>
                            {row.statusCode}
                          </p>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SeverityBadge severity={row.severity} />
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[11px] font-mono text-gray-600">
                          {row.actorId ? row.actorId.slice(0, 8).toUpperCase() : <span className="text-gray-300">—</span>}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RoleBadge role={row.actorRole} />
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[11px] font-mono text-gray-500">
                          {row.ipAddress ?? <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-gray-500">
                          {row.response?.durationMs != null ? `${row.response.durationMs} ms` : <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelected(row)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            onClick={e => handleDeleteClick(e, row.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSuperAdmin
                                ? "border-red-200 text-red-500 hover:bg-red-50"
                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                            }`}
                            title={isSuperAdmin ? "Delete log" : "Unauthorized — super admin only"}
                          >
                            <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && rows.length > 0 && (
            <Pagination meta={meta} page={page} totalPages={totalPages} label="events" onPage={setPage} />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAuditLogPage;
