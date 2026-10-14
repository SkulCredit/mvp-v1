import React, { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import { toastSuccess, toastError } from "../../utils/toast";
import {
  BRAND, PAGE_SIZES, fmtDate, useDebounce,
  SearchIcon, ChevronDown, ResetIcon, Pagination, Ic,
} from "./components/shared";

type TicketStatus   = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface Ticket {
  id: string;
  userId: string;
  userRole: "parent" | "school" | "admin";
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; phoneNumber: string | null };
}

interface Stats { open: number; in_progress: number; resolved: number; closed: number; total: number; }
interface PageMeta { total: number; page: number; limit: number; }

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string; dot: string; label: string }> = {
  open:        { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Open"        },
  in_progress: { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "In Progress" },
  resolved:    { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Resolved"    },
  closed:      { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   label: "Closed"      },
};

const PRIORITY_CFG: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  low:    { bg: "bg-gray-100",   text: "text-gray-500",   label: "Low"    },
  medium: { bg: "bg-blue-50",    text: "text-blue-600",   label: "Medium" },
  high:   { bg: "bg-orange-50",  text: "text-orange-600", label: "High"   },
  urgent: { bg: "bg-red-50",     text: "text-red-600",    label: "Urgent" },
};

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-current/20 ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const c = PRIORITY_CFG[priority];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; dot: string }> = ({ label, value, color, dot }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
    <div>
      <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className={`text-xs font-semibold mt-0.5 ${color}`}>{label}</p>
    </div>
  </div>
);

const TICKET_STATUS_OPTIONS = [
  { label: "All Status",   value: "" },
  { label: "Open",         value: "open" },
  { label: "In Progress",  value: "in_progress" },
  { label: "Resolved",     value: "resolved" },
  { label: "Closed",       value: "closed" },
];

const PRIORITY_OPTIONS = [
  { label: "All Priority", value: "" },
  { label: "Low",          value: "low" },
  { label: "Medium",       value: "medium" },
  { label: "High",         value: "high" },
  { label: "Urgent",       value: "urgent" },
];

const ROLE_OPTIONS = [
  { label: "All Roles",  value: "" },
  { label: "Parent",     value: "parent" },
  { label: "School",     value: "school" },
];

const TicketDetailDrawer: React.FC<{
  ticket: Ticket | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<{ status: TicketStatus; priority: TicketPriority; adminReply: string }>) => Promise<void>;
  saving: boolean;
}> = ({ ticket, onClose, onUpdate, saving }) => {
  const [reply,    setReply]    = useState("");
  const [status,   setStatus]   = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ticket) {
      setReply(ticket.adminReply ?? "");
      setStatus(ticket.status);
      setPriority(ticket.priority);
    }
  }, [ticket]);

  useEffect(() => {
    if (!ticket) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [ticket, onClose]);

  const handleSave = async () => {
    if (!ticket) return;
    const payload: Partial<{ status: TicketStatus; priority: TicketPriority; adminReply: string }> = {
      status,
      priority,
    };
    if (reply.trim()) payload.adminReply = reply.trim();
    await onUpdate(ticket.id, payload);
  };

  if (!ticket) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        aria-label="Ticket detail"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900 line-clamp-1">{ticket.subject}</h2>
            <p className="text-xs text-gray-400 mt-0.5">#{ticket.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <Ic d="M18 6L6 18M6 6l12 12" cls="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
              {ticket.userRole}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">From</p>
            <p className="text-sm font-semibold text-gray-800">{ticket.user?.email ?? "—"}</p>
            {ticket.user?.phoneNumber && (
              <p className="text-xs text-gray-500">{ticket.user.phoneNumber}</p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Message</p>
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>

          {ticket.adminReply && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Previous Reply</p>
              <div className="bg-[#7A0E42]/5 border border-[#7A0E42]/10 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {ticket.adminReply}
              </div>
              {ticket.repliedAt && (
                <p className="text-xs text-gray-400 mt-1">Replied {fmtDate(ticket.repliedAt)}</p>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Ticket</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as TicketStatus)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#7A0E42] appearance-none bg-white cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <ChevronDown />
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Priority</label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#7A0E42] appearance-none bg-white cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <ChevronDown />
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Reply to user <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                ref={textRef}
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={4}
                placeholder="Type your reply here…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 resize-none transition-colors placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
            <span>Submitted: <span className="font-medium text-gray-700">{fmtDate(ticket.createdAt)}</span></span>
            {ticket.resolvedAt && (
              <span>Resolved: <span className="font-medium text-gray-700">{fmtDate(ticket.resolvedAt)}</span></span>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND }}
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
};

const AdminSupportPage: React.FC = () => {
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [roleFilter,     setRoleFilter]     = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [page,           setPage]           = useState(1);
  const [limit,          setLimit]          = useState(20);

  const [rows,    setRows]    = useState<Ticket[]>([]);
  const [meta,    setMeta]    = useState<PageMeta>({ total: 0, page: 1, limit: 20 });
  const [stats,   setStats]   = useState<Stats>({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [selected, setSelected] = useState<Ticket | null>(null);
  const [saving,   setSaving]   = useState(false);

  const [deleteTarget,  setDeleteTarget]  = useState<Ticket | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Stats }>("/admin/support/tickets/stats");
      setStats(res.data.data);
    } catch { /* non-critical */ }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search",   debouncedSearch);
      if (statusFilter)    params.set("status",   statusFilter);
      if (priorityFilter)  params.set("priority", priorityFilter);
      if (roleFilter)      params.set("userRole", roleFilter);
      if (dateFrom)        params.set("fromDate", dateFrom);
      if (dateTo)          params.set("toDate",   dateTo + "T23:59:59");
      params.set("page",  String(page));
      params.set("limit", String(limit));

      const res = await apiClient.get<{
        data: { total: number; page: number; limit: number; data: Ticket[] };
      }>(`/admin/support/tickets?${params}`);
      setRows(res.data.data.data);
      setMeta({ total: res.data.data.total, page: res.data.data.page, limit: res.data.data.limit });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, roleFilter, dateFrom, dateTo, page, limit]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, priorityFilter, roleFilter, dateFrom, dateTo]);

  const handleUpdate = async (id: string, data: Partial<{ status: TicketStatus; priority: TicketPriority; adminReply: string }>) => {
    setSaving(true);
    try {
      await apiClient.patch(`/admin/support/tickets/${id}`, data);
      toastSuccess("Ticket updated.");
      setSelected(null);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/support/tickets/${deleteTarget.id}`);
      toastSuccess("Ticket deleted.");
      setDeleteTarget(null);
      fetchTickets();
      fetchStats();
    } catch (err) {
      toastError((err as { message?: string }).message ?? "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));

  const resetFilters = () => {
    setSearch(""); setStatusFilter(""); setPriorityFilter("");
    setRoleFilter(""); setDateFrom(""); setDateTo(""); setPage(1);
  };
  const hasFilters = !!(search || statusFilter || priorityFilter || roleFilter || dateFrom || dateTo);

  return (
    <>
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-900">Delete Ticket?</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">
              "<span className="font-semibold text-gray-700">{deleteTarget.subject}</span>" will be permanently removed.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleteLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <TicketDetailDrawer
        ticket={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        saving={saving}
      />

      <div className="max-w-[1200px] mx-auto py-6 sm:py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-1">Manage support tickets · reply, update status, and resolve issues</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Open"        value={stats.open}        color="text-amber-600"  dot="bg-amber-400"  />
          <StatCard label="In Progress" value={stats.in_progress} color="text-blue-600"   dot="bg-blue-500"   />
          <StatCard label="Resolved"    value={stats.resolved}    color="text-green-600"  dot="bg-green-500"  />
          <StatCard label="Closed"      value={stats.closed}      color="text-gray-500"   dot="bg-gray-400"   />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 focus-within:border-[#7A0E42] focus-within:ring-2 focus-within:ring-[#7A0E42]/10 transition-colors">
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subject or email…"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>

          {[
            { value: statusFilter,   setter: setStatusFilter,   opts: TICKET_STATUS_OPTIONS },
            { value: priorityFilter, setter: setPriorityFilter, opts: PRIORITY_OPTIONS      },
            { value: roleFilter,     setter: setRoleFilter,     opts: ROLE_OPTIONS          },
          ].map(({ value, setter, opts }, i) => (
            <div key={i} className="relative">
              <select
                value={value}
                onChange={e => setter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
              >
                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
            </div>
          ))}

          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
          />
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
          />

          <div className="relative">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 py-2 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#7A0E42] cursor-pointer"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDown /></span>
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#7A0E42] transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          )}
        </div>

        {/* Ticket inbox card list */}
        <div className="space-y-3">
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              ))}
            </>
          ) : error ? (
            <p className="py-16 text-center text-sm text-red-500">{error}</p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">No tickets found.</p>
          ) : (
            rows.map(row => (
              <div
                key={row.id}
                onClick={() => setSelected(row)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
              >
                {/* Card header: badges left, role right */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={row.priority} />
                    <StatusBadge status={row.status} />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                    {row.userRole}
                  </span>
                </div>

                {/* Subject */}
                <p className="font-semibold text-gray-900 truncate mt-2">{row.subject}</p>

                {/* Message preview */}
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{row.message}</p>

                {/* Card footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {row.user?.email ?? "—"} · #{row.id.slice(0, 8).toUpperCase()} · {fmtDate(row.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(row); }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && rows.length > 0 && (
          <Pagination meta={meta} page={page} totalPages={totalPages} label="tickets" onPage={setPage} />
        )}
      </div>
    </>
  );
};

export default AdminSupportPage;
