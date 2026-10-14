import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supportService } from "../../services/supportService";
import { toastSuccess, toastError } from "../../utils/toast";
import type {
  SupportTicketItem,
  SupportTicketMessageItem,
  SupportTicketTagItem,
  TicketStatus,
  CsManager,
} from "../../components/types/supports";

const BRAND = "#7A0E42";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string; dot: string; label: string }> = {
  open:              { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Open"              },
  in_progress:       { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "In Progress"       },
  awaiting_customer: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400", label: "Awaiting Customer" },
  escalated:         { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Escalated"         },
  resolved:          { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Resolved"          },
  closed:            { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   label: "Closed"            },
};

const PRIORITY_CFG = {
  low:    { bg: "bg-gray-100",  text: "text-gray-500",  label: "Low"    },
  medium: { bg: "bg-blue-50",   text: "text-blue-600",  label: "Medium" },
  high:   { bg: "bg-orange-50", text: "text-orange-600",label: "High"   },
  urgent: { bg: "bg-red-50",    text: "text-red-600",   label: "Urgent" },
};

interface FullTicket extends SupportTicketItem {
  messages: SupportTicketMessageItem[];
  tags: SupportTicketTagItem[];
  user?: { id: string; email: string; phoneNumber?: string | null; isActive?: boolean } | null;
}

type MsgTab = "all" | "internal";

interface AuditEntry {
  id: string;
  action: string;
  actorEmail?: string;
  createdAt: string;
}

const CSTicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket,   setTicket]   = useState<FullTicket | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [msgTab,   setMsgTab]   = useState<MsgTab>("all");

  const [replyBody,   setReplyBody]   = useState("");
  const [sendingReply,setSendingReply]= useState(false);

  const [newStatus,     setNewStatus]     = useState<TicketStatus>("open");
  const [updatingStatus,setUpdatingStatus]= useState(false);

  const [showEscalate,   setShowEscalate]   = useState(false);
  const [managers,       setManagers]       = useState<CsManager[]>([]);
  const [managersLoaded, setManagersLoaded] = useState(false);
  const [selectedManager,setSelectedManager]= useState("");
  const [escalateNote,   setEscalateNote]   = useState("");
  const [escalating,     setEscalating]     = useState(false);

  const [auditOpen,   setAuditOpen]   = useState(false);
  const [auditData,   setAuditData]   = useState<AuditEntry[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditLoading,setAuditLoading]= useState(false);

  const loadTicket = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supportService.csGetTicket(id);
      setTicket(data as FullTicket);
      setNewStatus(data.status);
    } catch {
      setError("Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTicket(); }, [id]);

  const handleSendReply = async (visibility: "public" | "internal") => {
    if (!id || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      await supportService.csAddMessage(id, { body: replyBody, visibility });
      toastSuccess(visibility === "public" ? "Reply sent." : "Internal note added.");
      setReplyBody("");
      await loadTicket();
    } catch {
      toastError("Failed to send message.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      await supportService.csUpdateTicket(id, { status: newStatus });
      toastSuccess("Status updated.");
      await loadTicket();
    } catch {
      toastError("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEscalate = async () => {
    if (!id || !selectedManager) return;
    setEscalating(true);
    try {
      await supportService.csEscalate(id, { managerId: selectedManager, note: escalateNote || undefined });
      toastSuccess("Ticket escalated successfully.");
      setShowEscalate(false);
      setSelectedManager("");
      setEscalateNote("");
      await loadTicket();
    } catch {
      toastError("Failed to escalate ticket.");
    } finally {
      setEscalating(false);
    }
  };

  const handleOpenEscalate = async () => {
    setShowEscalate(v => !v);
    if (!managersLoaded) {
      try {
        const data = await supportService.csListManagers();
        setManagers(data);
        setManagersLoaded(true);
      } catch {
        toastError("Failed to load managers.");
      }
    }
  };

  const handleToggleAudit = async () => {
    const next = !auditOpen;
    setAuditOpen(next);
    if (next && !auditLoaded && id) {
      setAuditLoading(true);
      try {
        const data = await supportService.csTicketAudit(id, { page: "1", limit: "10" });
        const result = data as { data?: AuditEntry[]; total?: number } | AuditEntry[];
        if (Array.isArray(result)) {
          setAuditData(result);
        } else if (result && typeof result === "object" && Array.isArray((result as { data?: AuditEntry[] }).data)) {
          setAuditData((result as { data: AuditEntry[] }).data);
        }
        setAuditLoaded(true);
      } catch {
        toastError("Failed to load audit log.");
      } finally {
        setAuditLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-6 pb-12 max-w-[1200px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="pt-6 pb-12 max-w-[1200px]">
        <button onClick={() => navigate("/cs/issues")} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-6">
          <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" /> Back to Issues
        </button>
        <p className="text-sm text-red-500">{error ?? "Ticket not found."}</p>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
  const priorityCfg = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.medium;
  const visibleMessages = msgTab === "all" ? ticket.messages : ticket.messages.filter(m => m.visibility === "internal");

  return (
    <div className="pt-6 pb-12 max-w-[1200px] space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate("/cs/issues")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />
          Back
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm font-bold text-gray-800">{ticket.ticketNumber}</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${priorityCfg.bg} ${priorityCfg.text}`}>
          {priorityCfg.label}
        </span>
        {ticket.escalationLevel > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
            Escalated L{ticket.escalationLevel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Ticket Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="text-gray-800 font-medium">{ticket.subject}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Category</p>
                <p className="text-gray-800 capitalize">{ticket.category?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Submitter Role</p>
                <p className="text-gray-800 capitalize">{ticket.userRole}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Created</p>
                <p className="text-gray-800">{fmtDate(ticket.createdAt)}</p>
              </div>
              {(ticket as FullTicket & { user?: { email: string } | null }).user && (
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Submitter Email</p>
                  <p className="text-gray-800">{(ticket as FullTicket & { user: { email: string } }).user.email}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Original Message</p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {ticket.message}
              </div>
            </div>
            {ticket.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Tagged Managers</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map(tag => (
                    <span key={tag.id} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                      {tag.taggedUser?.email ?? tag.userId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100">
              {(["all", "internal"] as MsgTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMsgTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                    msgTab === tab
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={msgTab === tab ? { backgroundColor: BRAND } : {}}
                >
                  {tab === "all" ? "All Messages" : "Internal Notes"}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[400px] overflow-y-auto">
              {visibleMessages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No messages yet.</p>
              ) : (
                visibleMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.authorType === "customer_service" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        msg.authorType === "customer_service"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {msg.authorType === "customer_service" ? (msg.author?.email ?? "Support") : "Customer"}
                      </span>
                      {msg.visibility === "internal" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Internal
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">{fmtDate(msg.createdAt)}</span>
                    </div>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                      msg.authorType === "customer_service"
                        ? "text-white"
                        : "bg-gray-50 text-gray-700 border border-gray-100"
                    }`}
                    style={msg.authorType === "customer_service" ? { backgroundColor: BRAND } : {}}>
                      {msg.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                rows={3}
                placeholder="Type a reply or internal note..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none resize-none focus:ring-2 transition-colors"
                style={{ focusRingColor: BRAND } as React.CSSProperties}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendReply("public")}
                  disabled={sendingReply || !replyBody.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: BRAND }}
                  onMouseEnter={e => { if (!sendingReply) e.currentTarget.style.backgroundColor = "#5e0a31"; }}
                  onMouseLeave={e => { if (!sendingReply) e.currentTarget.style.backgroundColor = BRAND; }}
                >
                  <Ic d="M22 2L11 13M22 2 15 22 11 13 2 9l20-7z" cls="w-3.5 h-3.5" />
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
                <button
                  onClick={() => handleSendReply("internal")}
                  disabled={sendingReply || !replyBody.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <Ic d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" cls="w-3.5 h-3.5" />
                  Add Internal Note
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Update Status</h3>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as TicketStatus)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 bg-white outline-none focus:ring-2 transition-colors mb-3"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer">Awaiting Customer</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus || newStatus === ticket.status}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={e => { if (!updatingStatus) e.currentTarget.style.backgroundColor = "#5e0a31"; }}
              onMouseLeave={e => { if (!updatingStatus) e.currentTarget.style.backgroundColor = BRAND; }}
            >
              {updatingStatus ? "Updating..." : "Update Status"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">Escalation</h3>
              <button
                onClick={handleOpenEscalate}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
              >
                {showEscalate ? "Cancel" : "Escalate to Manager"}
              </button>
            </div>

            {showEscalate && (
              <div className="space-y-3">
                <select
                  value={selectedManager}
                  onChange={e => setSelectedManager(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white outline-none"
                >
                  <option value="">Select manager...</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName ?? m.email}
                    </option>
                  ))}
                </select>
                <textarea
                  value={escalateNote}
                  onChange={e => setEscalateNote(e.target.value)}
                  rows={2}
                  placeholder="Optional note for manager..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
                />
                <button
                  onClick={handleEscalate}
                  disabled={escalating || !selectedManager}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 bg-orange-500 hover:bg-orange-600"
                >
                  {escalating ? "Escalating..." : "Confirm Escalation"}
                </button>
              </div>
            )}

            {ticket.escalationLevel === 0 && !showEscalate && (
              <p className="text-xs text-gray-400">No escalations yet.</p>
            )}
            {ticket.escalationLevel > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                Escalated {ticket.escalationLevel} time{ticket.escalationLevel !== 1 ? "s" : ""}.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={handleToggleAudit}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <span>Audit Log</span>
              <Ic d={auditOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} cls="w-4 h-4 text-gray-400" />
            </button>

            {auditOpen && (
              <div className="border-t border-gray-100 px-5 py-4">
                {auditLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : auditData.length === 0 ? (
                  <p className="text-xs text-gray-400">No audit entries found.</p>
                ) : (
                  <div className="space-y-3">
                    {auditData.map(entry => (
                      <div key={entry.id} className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-gray-800 capitalize">
                          {entry.action?.replace(/_/g, " ").toLowerCase()}
                        </p>
                        {entry.actorEmail && (
                          <p className="text-[11px] text-gray-400">{entry.actorEmail}</p>
                        )}
                        <p className="text-[11px] text-gray-400">{fmtDate(entry.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSTicketDetailPage;
