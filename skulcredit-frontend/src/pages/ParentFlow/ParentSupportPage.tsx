import React, { useEffect, useState } from "react";
import {
  ChatIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  SupportIcon,
} from "../../components/ui/NavIcons";
import { supportService } from "../../services/supportService";
import { toastSuccess, toastError } from "../../utils/toast";
import type { FaqItem, SupportTicketItem, TicketStatus } from "../../components/types/supports";
import type { SupportTicketMessageItem } from "../../components/types/supports";

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CONTACT_CHANNELS = [
  {
    icon: PhoneIcon,
    title: "Phone Support",
    detail: "+234 800-700-01 SKULCREDIT",
    meta: "Mon-Fri: 8am - 6pm WAT",
    action: "Call Now",
    href: "tel:+2348007550100",
  },
  {
    icon: MailIcon,
    title: "Email Support",
    detail: "support@skulcredit.com",
    meta: "Response within 24 hours",
    action: "Send Email",
    href: "mailto:support@skulcredit.com",
  },
  {
    icon: ChatIcon,
    title: "Live Chat",
    detail: "Chat with our team",
    meta: "Available 9am -5pm",
    action: "Start Chat",
    href: "#chat",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Who can apply for Skulcredit?",
    answer:
      "Any parent or guardian with a child enrolled in an eligible school can apply for Skulcredit tuition financing.",
  },
  {
    id: "2",
    question: "Do I need to be employed to qualify?",
    answer:
      "No, employment is not mandatory. We consider various income sources to assess eligibility.",
  },
  {
    id: "3",
    question: "How do I know my school is eligible?",
    answer:
      "You can check school eligibility during the application process or contact our support team.",
  },
  {
    id: "4",
    question: "How fast is the approval process?",
    answer:
      "Approvals typically happen within 24–48 hours after submission of a complete application.",
  },
  {
    id: "5",
    question: "Where does the money go after approval?",
    answer:
      "Funds are disbursed directly to your child's school, not to your personal account.",
  },
  {
    id: "6",
    question: "What repayment options are available?",
    answer:
      "We offer flexible repayment schedules — monthly installments tailored to your income.",
  },
  {
    id: "7",
    question: "What happens if I miss a repayment?",
    answer:
      "A late fee may apply. Please contact support immediately to restructure your repayment plan.",
  },
  {
    id: "8",
    question: "Is my personal data safe with Skulcredit?",
    answer:
      "Yes. All data is encrypted and stored securely in compliance with Nigerian data protection regulations.",
  },
  {
    id: "9",
    question: "Are there hidden fees or charges?",
    answer:
      "No hidden fees. All charges are clearly stated before you accept the loan offer.",
  },
  {
    id: "10",
    question: "Can students apply directly?",
    answer:
      "No, applications must be made by a parent or guardian on behalf of the student.",
  },
];

const STATUS_CFG: Record<TicketStatus, { bg: string; text: string; label: string }> = {
  open:               { bg: "bg-amber-50",   text: "text-amber-700",  label: "Open"              },
  in_progress:        { bg: "bg-blue-50",    text: "text-blue-700",   label: "In Progress"       },
  awaiting_customer:  { bg: "bg-purple-50",  text: "text-purple-700", label: "Awaiting Response" },
  escalated:          { bg: "bg-red-50",     text: "text-red-700",    label: "Escalated"         },
  resolved:           { bg: "bg-green-50",   text: "text-green-700",  label: "Resolved"          },
  closed:             { bg: "bg-gray-100",   text: "text-gray-600",   label: "Closed"            },
};

const CATEGORY_OPTIONS = [
  { value: "loan_application",   label: "Loan Application"   },
  { value: "payment",            label: "Payment"            },
  { value: "technical",          label: "Technical"          },
  { value: "document_upload",    label: "Document Upload"    },
  { value: "general_inquiry",    label: "General Inquiry"    },
  { value: "school_verification",label: "School Verification"},
  { value: "disbursement",       label: "Disbursement"       },
  { value: "other",              label: "Other"              },
];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

interface ExpandedThread {
  ticketId: string;
  messages: SupportTicketMessageItem[];
  loading: boolean;
}

const ParentSupportPage: React.FC = () => {
  const [subject,   setSubject]   = useState("");
  const [category,  setCategory]  = useState("general_inquiry");
  const [message,   setMessage]   = useState("");
  const [isSending, setIsSending] = useState(false);
  const [openFaq,   setOpenFaq]   = useState<string | null>(null);

  const [tickets,       setTickets]       = useState<SupportTicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError,  setTicketsError]  = useState<string | null>(null);
  const [statusFilter,  setStatusFilter]  = useState<string>("");
  const [expanded,      setExpanded]      = useState<ExpandedThread | null>(null);
  const [hideConfirm,   setHideConfirm]   = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setTicketsLoading(true);
      setTicketsError(null);
      try {
        const res = await supportService.listMyTickets({ limit: "20" });
        setTickets(res.data);
      } catch {
        setTicketsError("Failed to load complaints. Please try again.");
      } finally {
        setTicketsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setIsSending(true);
    try {
      const ticket = await supportService.createTicket({ subject, message, category });
      toastSuccess(`Ticket #${ticket.ticketNumber} submitted successfully.`);
      setTickets(prev => [ticket, ...prev]);
      setSubject("");
      setMessage("");
      setCategory("general_inquiry");
    } catch {
      toastError("Failed to submit ticket. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleTrack = async (ticketId: string) => {
    if (expanded?.ticketId === ticketId) {
      setExpanded(null);
      return;
    }
    setExpanded({ ticketId, messages: [], loading: true });
    try {
      const data = await supportService.getMyTicket(ticketId);
      const publicMessages = (data.messages ?? []).filter(m => m.visibility === "public");
      setExpanded({ ticketId, messages: publicMessages, loading: false });
    } catch {
      setExpanded({ ticketId, messages: [], loading: false });
    }
  };

  const handleHide = async (ticketId: string) => {
    try {
      await supportService.hideTicket(ticketId);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setHideConfirm(null);
      if (expanded?.ticketId === ticketId) setExpanded(null);
      toastSuccess("Complaint removed from view.");
    } catch {
      toastError("Failed to remove complaint.");
    }
  };

  const filtered = tickets.filter(t =>
    !statusFilter || t.status === statusFilter,
  );

  return (
    <div className="flex flex-col gap-6 mt-12 w-[90%] mx-auto animate-fade-in-up">
      <div className="rounded-2xl bg-[#8B1C53] px-6 pt-8 pb-6 text-white text-center">
        <h2 className="text-xl font-bold">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-white/70">
          We're here to help you with any questions or concerns
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACT_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.title}
                className="rounded-xl bg-white px-5 py-6 flex flex-col items-center gap-3 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B1C53]/10">
                  <Icon className="text-[#8B1C53]" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-gray-800">{ch.title}</p>
                  <p className="text-xs text-gray-500">{ch.detail}</p>
                  <p className="text-xs text-gray-400">{ch.meta}</p>
                </div>

                <a href={ch.href} className="w-full mt-1">
                  <button className="w-full rounded-lg border border-[#8B1C53] px-4 py-2 text-xs font-semibold text-[#8B1C53] bg-white hover:bg-[#8B1C53]/5 transition-colors">
                    {ch.action}
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-xl bg-white px-6 py-6"
        style={{ border: "1px solid #8D8D8D" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <SendIcon className="text-gray-800 w-5 h-5" />
          <p className="text-base font-bold text-gray-900">Send us a Message</p>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              required
              placeholder="Please provide detailed information as much as possible...."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none resize-none focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
            />
          </div>

          <div className="flex items-start gap-1.5">
            <ShieldIcon className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              We typically respond within 24 hours during business days. For
              urgent matters, please call our support line.
            </p>
          </div>

          <div className="flex gap-3 mt-1">
            <button
              type="submit"
              disabled={isSending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8B1C53] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
            >
              <SendIcon className="w-4 h-4 text-white" />
              {isSending ? "Sending..." : "Send Message"}
            </button>
            <button
              type="button"
              onClick={() => { setSubject(""); setMessage(""); setCategory("general_inquiry"); }}
              className="rounded-lg border border-[#8B1C53] px-5 py-3 text-sm font-semibold text-[#8B1C53] bg-white hover:bg-[#8B1C53]/5 transition-colors"
            >
              Clear Message
            </button>
          </div>
        </form>
      </div>

      <div
        className="rounded-xl bg-white px-6 py-6"
        style={{ border: "1px solid #8D8D8D" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-gray-900">My Complaints</p>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white outline-none"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_customer">Awaiting Response</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {ticketsLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : ticketsError ? (
          <p className="text-sm text-red-500 text-center py-6">{ticketsError}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No complaints found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(ticket => {
              const cfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
              const isExpanded = expanded?.ticketId === ticket.id;
              const isPendingHide = hideConfirm === ticket.id;
              return (
                <div key={ticket.id} className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    <span className="text-xs font-mono text-gray-500 shrink-0">{ticket.ticketNumber}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{ticket.subject}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{fmtDate(ticket.createdAt)}</span>
                    <button
                      onClick={() => handleTrack(ticket.id)}
                      className="text-xs font-semibold text-[#8B1C53] border border-[#8B1C53] rounded-lg px-2.5 py-1 hover:bg-[#8B1C53]/5 transition-colors shrink-0"
                    >
                      {isExpanded ? "Hide" : "Track"}
                    </button>
                    {isPendingHide ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleHide(ticket.id)}
                          className="text-xs font-semibold text-red-600 border border-red-300 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setHideConfirm(null)}
                          className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setHideConfirm(ticket.id)}
                        className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        title="Remove from view"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      {expanded.loading ? (
                        <p className="text-sm text-gray-400">Loading thread...</p>
                      ) : expanded.messages.length === 0 ? (
                        <p className="text-sm text-gray-400">No messages yet.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {expanded.messages.map(msg => (
                            <div key={msg.id} className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${msg.authorType === 'customer_service' ? 'bg-[#8B1C53]/10 text-[#8B1C53]' : 'bg-gray-100 text-gray-600'}`}>
                                  {msg.authorType === 'customer_service' ? 'Support' : 'You'}
                                </span>
                                <span className="text-[11px] text-gray-400">{fmtDate(msg.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100">{msg.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-xl bg-white px-6 py-6"
        style={{ border: "1px solid #8D8D8D" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <SupportIcon className="text-gray-500 w-4 h-4" />
          <p className="text-sm font-bold text-gray-900">
            Frequently Asked Questions
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #BFBFBF" }}
            >
              <button
                onClick={() =>
                  setOpenFaq((prev) => (prev === faq.id ? null : faq.id))
                }
                className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-800">{faq.question}</span>
                <span className="shrink-0 ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B1C53]">
                  <ChevronDownIcon
                    className={`text-white w-4 h-4 transition-transform duration-200 ${
                      openFaq === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {openFaq === faq.id && (
                <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentSupportPage;
