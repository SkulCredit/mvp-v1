import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supportService } from "../../services/supportService";
import { toastSuccess, toastError } from "../../utils/toast";
import type { TicketStatus, TicketPriority, SupportTicketItem } from "../../components/types/supports";

const BRAND = "#7A0E42";
const PAGE_SIZES = [10, 25, 50];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function useDebounce<T>(value: T, ms = 400): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

interface PageMeta { total: number; page: number; limit: number; }

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string; dot: string; label: string }> = {
  open:              { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Open"              },
  in_progress:       { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "In Progress"       },
  awaiting_customer: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400", label: "Awaiting Customer" },
  escalated:         { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Escalated"         },
  resolved:          { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Resolved"          },
  closed:            { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   label: "Closed"            },
};

const PRIORITY_CFG: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  low:    { bg: "bg-gray-100",   text: "text-gray-500",   label: "Low"    },
  medium: { bg: "bg-blue-50",    text: "text-blue-600",   label: "Medium" },
  high:   { bg: "bg-orange-50",  text: "text-orange-600", label: "High"   },
  urgent: { bg: "bg-red-50",     text: "text-red-600",    label: "Urgent" },
};

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const c = PRIORITY_CFG[priority] ?? PRIORITY_CFG.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

interface Ticket extends SupportTicketItem {
  ticketId?: string;
  customerName?: string;
  customerEmail?: string;
  customerType?: "parent" | "school";
  issueType?: string;
}

const CSIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tickets,        setTickets]       = useState<Ticket[]>([]);
  const [meta,           setMeta]          = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState<string | null>(null);
  const [search,         setSearch]        = useState("");
  const [statusFilter,   setStatusFilter]  = useState<string>(searchParams.get("status") ?? "");
  const [priorityFilter, setPriorityFilter]= useState<string>("");
  const [pageSize,       setPageSize]      = useState(10);
  const [page,           setPage]          = useState(1);

  const dSearch = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, string> = {
        page: String(page),
        limit: String(pageSize),
      };
      if (dSearch)       query.search   = dSearch;
      if (statusFilter)  query.status   = statusFilter;
      if (priorityFilter)query.priority = priorityFilter;

      const res = await supportService.csListTickets(query);
      setTickets(res.data as Ticket[]);
      setMeta({ total: res.total, page: res.page, limit: res.limit });
    } catch {
      setError("Failed to load tickets. Please try again.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [dSearch, statusFilter, priorityFilter, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dSearch, statusFilter, priorityFilter, pageSize]);

  const handleUpdateStatus = async (id: string, status: TicketStatus) => {
    try {
      await supportService.csUpdateTicket(id, { status });
      toastSuccess("Ticket status updated.");
      load();
    } catch {
      toastError("Failed to update ticket status.");
    }
  };

  const totalPages = Math.ceil(meta.total / pageSize) || 1;

  const statsCfg = [
    { label: "Total",            filter: "",                 color: "bg-gray-100 text-gray-700"  },
    { label: "Open",             filter: "open",             color: "bg-amber-50 text-amber-700" },
    { label: "In Progress",      filter: "in_progress",      color: "bg-blue-50 text-blue-700"   },
    { label: "Awaiting Customer",filter: "awaiting_customer",color: "bg-purple-50 text-purple-700"},
    { label: "Escalated",        filter: "escalated",        color: "bg-red-50 text-red-700"     },
    { label: "Resolved",         filter: "resolved",         color: "bg-green-50 text-green-700" },
    { label: "Closed",           filter: "closed",           color: "bg-gray-50 text-gray-500"   },
  ];

  return (
    <div className="pt-6 pb-12 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Issues</h1>
          <p className="text-sm text-gray-500 mt-0.5">View, update and manage all customer support tickets.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {statsCfg.map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              statusFilter === s.filter
                ? "border-transparent shadow-sm " + s.color
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" cls="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
              placeholder="Search by ticket ID, customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_customer">Awaiting Customer</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>

          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Ic d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" cls="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Ticket #","Subject","Category","Priority","Status","Escalation","Updated","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-red-500">{error}</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">No tickets found.</td></tr>
              ) : tickets.map(ticket => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 max-w-[200px] truncate">{ticket.subject}</p>
                    <p className="text-[11px] text-gray-400 capitalize">{ticket.userRole}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{ticket.category?.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3">
                    {ticket.escalationLevel > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600">
                        Level {ticket.escalationLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(ticket.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/cs/issues/${ticket.id}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ backgroundColor: BRAND }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}
                      >
                        View
                      </button>
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            handleUpdateStatus(ticket.id, e.target.value as TicketStatus);
                            e.target.value = "";
                          }
                        }}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 bg-white outline-none cursor-pointer"
                      >
                        <option value="" disabled>Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="awaiting_customer">Awaiting Customer</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * pageSize + 1, meta.total)}–{Math.min(page * pageSize, meta.total)} of {meta.total} tickets
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    page === pg ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={page === pg ? { backgroundColor: BRAND } : {}}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Ic d="M9 18l6-6-6-6" cls="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSIssuesPage;
