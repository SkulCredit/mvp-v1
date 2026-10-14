import React, { useEffect, useRef, useState, useCallback } from "react";
import { AppNotification } from "../../services/notificationService";
import notificationService from "../../services/notificationService";

const SYSTEM_TYPES = new Set([
  "application_submitted",
  "application_approved",
  "application_rejected",
  "application_info_requested",
  "disbursement_completed",
  "disbursement_failed",
  "payment_received",
  "payment_overdue",
  "school_approved",
  "school_rejected",
  "account_action",
]);

function isSystemNotification(type: string): boolean {
  return SYSTEM_TYPES.has(type);
}

const TYPE_LABEL: Record<string, string> = {
  application_submitted: "Application",
  application_approved: "Application",
  application_rejected: "Application",
  application_info_requested: "Application",
  disbursement_completed: "Disbursement",
  disbursement_failed: "Disbursement",
  payment_received: "Payment",
  payment_overdue: "Payment",
  school_approved: "School",
  school_rejected: "School",
  account_action: "Account",
  general: "Message",
};

const TYPE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  application_submitted: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  application_approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  application_rejected: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  application_info_requested: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  disbursement_completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  disbursement_failed: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  payment_received: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  payment_overdue: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  school_approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  school_rejected: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  account_action: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
  },
  general: { bg: "bg-brand/5", text: "text-brand", dot: "bg-brand" },
};

function fmtFull(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  notification: AppNotification | null;
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationDrawer: React.FC<Props> = ({
  notification,
  open,
  onClose,
  onMarkRead,
}) => {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && notification && !notification.isRead) {
      onMarkRead(notification.id);
    }
    setReplyText("");
    setSendError("");
    setSendSuccess(false);
  }, [open, notification]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = useCallback(async () => {
    if (!notification || !replyText.trim()) return;
    setSendError("");
    setSending(true);
    try {
      await notificationService.replyToNotification(
        notification.id,
        replyText.trim(),
      );
      setSendSuccess(true);
      setReplyText("");
      setTimeout(() => setSendSuccess(false), 3000);
    } catch {
      setSendError("Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  }, [notification, replyText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const systemNotif = notification
    ? isSystemNotification(notification.type)
    : true;
  const color = notification
    ? (TYPE_COLOR[notification.type] ?? TYPE_COLOR.general)
    : TYPE_COLOR.general;
  const typeLabel = notification
    ? (TYPE_LABEL[notification.type] ?? "Notification")
    : "";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification detail"
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl
          w-full sm:w-[380px] lg:w-[420px] lg:max-w-[460px]
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {notification && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}
              >
                {typeLabel}
              </span>
            )}
            <span className="text-sm font-bold text-slate-800">
              {systemNotif ? "Notification" : "Message"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!notification ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400 px-6 py-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-slate-300"
                    aria-hidden="true"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-500">
                  No notification selected
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-extrabold text-slate-900 leading-snug flex-1">
                    {notification.title}
                  </h2>
                  {!notification.isRead && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-brand shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {fmtFull(notification.createdAt)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>{timeAgo(notification.createdAt)}</span>
                </div>
              </div>

              <div className={`rounded-2xl ${color.bg} px-5 py-4`}>
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${color.dot}`}
                  />
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {notification.message}
                  </p>
                </div>
              </div>

              {notification.referenceId && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-slate-400 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                      {notification.referenceType ?? "Reference"}
                    </p>
                    <p className="text-xs font-mono text-slate-600 truncate">
                      {notification.referenceId}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-100 px-4 py-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                    Type
                  </p>
                  <p className="text-xs font-semibold text-slate-700 capitalize">
                    {notification.type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                    Status
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      notification.isRead ? "text-slate-400" : "text-brand"
                    }`}
                  >
                    {notification.isRead ? "Read" : "Unread"}
                  </p>
                </div>
                {notification.readAt && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                      Read at
                    </p>
                    <p className="text-xs text-slate-600">
                      {fmtFull(notification.readAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {notification && !systemNotif && (
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 bg-slate-50/60 space-y-3">
            {sendSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Reply sent successfully.
              </div>
            )}
            {sendError && (
              <p className="text-xs text-red-600 font-medium px-1">
                {sendError}
              </p>
            )}
            <div className="flex items-end gap-2.5">
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 transition-colors overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    if (sendError) setSendError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply… (⌘↵ to send)"
                  rows={2}
                  className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none resize-none leading-relaxed"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                aria-label="Send reply"
                className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 px-1">
              Press ⌘↵ or Ctrl↵ to send quickly.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDrawer;
