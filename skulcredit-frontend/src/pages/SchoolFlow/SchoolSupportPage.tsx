import React, { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import {
  DashboardLayout,
  SchoolSidebar,
  SchoolTopBar,
} from "../../components/layout";
import { supportService } from "../../services/supportService";
import { toastSuccess, toastError } from "../../utils/toast";
import type { SupportTicketItem, TicketStatus } from "../../components/types/supports";
import type { SupportTicketMessageItem } from "../../components/types/supports";

const STATUS_CLS: Record<TicketStatus, string> = {
  open:              "bg-white text-blue-600 border border-blue-300",
  in_progress:       "bg-amber-50 text-amber-600 border border-amber-200",
  awaiting_customer: "bg-purple-50 text-purple-600 border border-purple-200",
  escalated:         "bg-red-50 text-red-600 border border-red-200",
  resolved:          "bg-green-50 text-green-700 border border-green-200",
  closed:            "bg-white text-slate-600 border border-slate-300",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:              "Open",
  in_progress:       "In Progress",
  awaiting_customer: "Awaiting Response",
  escalated:         "Escalated",
  resolved:          "Resolved",
  closed:            "Closed",
};

const CATEGORY_OPTIONS = [
  { value: "loan_application",    label: "Loan Application"    },
  { value: "payment",             label: "Payment"             },
  { value: "technical",           label: "Technical"           },
  { value: "document_upload",     label: "Document Upload"     },
  { value: "general_inquiry",     label: "General Inquiry"     },
  { value: "school_verification", label: "School Verification" },
  { value: "disbursement",        label: "Disbursement"        },
  { value: "other",               label: "Other"               },
];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

interface ThreadState {
  ticketId: string;
  messages: SupportTicketMessageItem[];
  loading: boolean;
  replyText: string;
  sending: boolean;
}

const SchoolSupportPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All Status");

  const [tickets,        setTickets]        = useState<SupportTicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError,   setTicketsError]   = useState<string | null>(null);

  const [showForm,    setShowForm]    = useState(false);
  const [subject,     setSubject]     = useState("");
  const [category,    setCategory]    = useState("general_inquiry");
  const [message,     setMessage]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [thread,      setThread]      = useState<ThreadState | null>(null);
  const [hideConfirm, setHideConfirm] = useState<string | null>(null);

  const loadTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = await supportService.listMyTickets({ limit: "20" });
      setTickets(res.data);
    } catch {
      setTicketsError("Failed to load tickets. Please try again.");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await supportService.createTicket({ subject, message, category });
      setSuccessBanner(`Ticket #${ticket.ticketNumber} submitted successfully.`);
      setTickets(prev => [ticket, ...prev]);
      setSubject("");
      setMessage("");
      setCategory("general_inquiry");
      setShowForm(false);
    } catch {
      toastError("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (ticketId: string) => {
    if (thread?.ticketId === ticketId) {
      setThread(null);
      return;
    }
    setThread({ ticketId, messages: [], loading: true, replyText: "", sending: false });
    try {
      const data = await supportService.getMyTicket(ticketId);
      const publicMessages = (data.messages ?? []).filter(m => m.visibility === "public");
      setThread(prev => prev ? { ...prev, messages: publicMessages, loading: false } : null);
    } catch {
      setThread(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!thread || thread.sending || !thread.replyText.trim()) return;
    setThread(prev => prev ? { ...prev, sending: true } : null);
    try {
      await supportService.replyTicket(ticketId, thread.replyText);
      toastSuccess("Reply sent.");
      const data = await supportService.getMyTicket(ticketId);
      const publicMessages = (data.messages ?? []).filter(m => m.visibility === "public");
      setThread(prev => prev ? { ...prev, messages: publicMessages, replyText: "", sending: false } : null);
    } catch {
      toastError("Failed to send reply.");
      setThread(prev => prev ? { ...prev, sending: false } : null);
    }
  };

  const handleHide = async (ticketId: string) => {
    try {
      await supportService.hideTicket(ticketId);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setHideConfirm(null);
      if (thread?.ticketId === ticketId) setThread(null);
      toastSuccess("Ticket removed from view.");
    } catch {
      toastError("Failed to remove ticket.");
    }
  };

  const visible = tickets.filter(t => {
    const matchStatus =
      statusFilter === "All Status" || t.status === statusFilter;
    const matchSearch =
      !search ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout
      sidebar={
        <SchoolSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={<SchoolTopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />}
    >
      <div className="pt-8 space-y-5 animate-fade-in-up w-[90%] mx-auto">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Support</h1>
          <p className="text-sm text-slate-500">
            Get help, raise complaints, or track your support tickets.
          </p>
        </div>

        {successBanner && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="text-green-500 font-semibold ml-4">✕</button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-xl hover:bg-[#7a1848] transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Submit Ticket
          </button>
          <button className="w-full flex items-center justify-center gap-2 border border-brand text-brand font-semibold py-3 rounded-xl hover:bg-brand/5 transition-colors">
            <Icon name="help-circle" className="w-4 h-4" />
            FAQs
          </button>
          <button className="w-full flex items-center justify-center gap-2 border border-brand text-brand font-semibold py-3 rounded-xl hover:bg-brand/5 transition-colors">
            <Icon name="message-circle" className="w-4 h-4" />
            Chat with Support
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Submit New Ticket</h2>
            <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  placeholder="What do you need help with?"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none resize-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand text-white font-semibold py-2.5 rounded-lg hover:bg-[#7a1848] transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-slate-200 text-slate-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by ticket ID or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-brand text-white text-sm font-semibold pl-4 pr-8 py-2.5 rounded-lg focus:outline-none cursor-pointer"
            >
              {["All Status", "open", "in_progress", "awaiting_customer", "escalated", "resolved", "closed"].map(s => (
                <option key={s} value={s}>
                  {s === "All Status" ? "All Status" : STATUS_LABELS[s as TicketStatus]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Your Tickets</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr] px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
              <span>Ticket ID</span>
              <span>Subject</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>

            {ticketsLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading tickets...</div>
            ) : ticketsError ? (
              <div className="py-12 text-center text-sm text-red-500">{ticketsError}</div>
            ) : visible.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No tickets found.</div>
            ) : (
              visible.map((t, i) => (
                <React.Fragment key={`${t.id}-${i}`}>
                  <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr] items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-mono text-slate-600">{t.ticketNumber}</span>
                    <span className="text-sm text-slate-700">{t.subject}</span>
                    <span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[t.status] ?? STATUS_CLS.open}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </span>
                    <span className="text-sm text-slate-500">{fmtDate(t.createdAt)}</span>
                    <span className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(t.id)}
                        className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                      >
                        {thread?.ticketId === t.id ? "Close" : "View"}
                        <Icon name="chevron-right" className="w-4 h-4" />
                      </button>
                      {hideConfirm === t.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleHide(t.id)} className="text-xs text-red-600 font-semibold border border-red-200 rounded px-1.5 py-0.5 hover:bg-red-50">Yes</button>
                          <button onClick={() => setHideConfirm(null)} className="text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setHideConfirm(t.id)}
                          title="Remove from view"
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  </div>

                  {thread?.ticketId === t.id && (
                    <div className="col-span-5 border-b border-slate-100 bg-slate-50 px-5 py-4">
                      {thread.loading ? (
                        <p className="text-sm text-slate-400">Loading messages...</p>
                      ) : (
                        <>
                          {thread.messages.length === 0 ? (
                            <p className="text-sm text-slate-400 mb-3">No messages yet.</p>
                          ) : (
                            <div className="flex flex-col gap-3 mb-4">
                              {thread.messages.map(msg => (
                                <div key={msg.id} className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${msg.authorType === 'customer_service' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'}`}>
                                      {msg.authorType === 'customer_service' ? 'Support' : 'You'}
                                    </span>
                                    <span className="text-[11px] text-gray-400">{fmtDate(msg.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">{msg.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <textarea
                              value={thread.replyText}
                              onChange={e => setThread(prev => prev ? { ...prev, replyText: e.target.value } : null)}
                              rows={2}
                              placeholder="Type a reply..."
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none resize-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                            <button
                              onClick={() => handleReply(t.id)}
                              disabled={thread.sending || !thread.replyText.trim()}
                              className="self-end bg-brand text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#7a1848] transition-colors disabled:opacity-60 text-sm"
                            >
                              {thread.sending ? "Sending..." : "Reply"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSupportPage;
