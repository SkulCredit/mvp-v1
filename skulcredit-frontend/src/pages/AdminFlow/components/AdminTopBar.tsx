import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import GlobalSearch from "../../../components/layout/GlobalSearch";
import { useNotifications } from "../../../context/NotificationContext";
import NotificationDrawer from "../../../components/notifications/NotificationDrawer";
import DashboardSettingsDrawer, {
  DashboardSettings,
  useDashboardSettings,
  loadSettings,
} from "./DashboardSettingsDrawer";
import { AppNotification } from "../../../services/notificationService";
import { resolveUploadUrl } from "../../../utils/uploadUrl";


function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
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

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({
  d,
  cls = "w-4 h-4",
}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

export interface AdminTopBarProps {
  onOpenMobileMenu?: () => void;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  const ctx = useDashboardSettings();
  const settings: DashboardSettings = ctx?.settings ?? loadSettings();
  const handleSettingsChange = (s: DashboardSettings) => ctx?.setSettings(s);

  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [activeNotif,     setActiveNotif]     = useState<AppNotification | null>(null);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [userOpen,        setUserOpen]        = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef,  () => setUserOpen(false));

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AB";

  const handleNotifClick = (n: AppNotification) => {
    setActiveNotif(n);
    setNotifOpen(false);
    setNotifDrawerOpen(true);
  };

  return (
    <>
      {/* Notification detail drawer */}
      <NotificationDrawer
        notification={activeNotif}
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        onMarkRead={markRead}
      />

      {/* Dashboard settings drawer */}
      <DashboardSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={handleSettingsChange}
      />

      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6 shrink-0 z-10">

        {/* Hamburger — mobile only, calls parent callback */}
        <button
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Search */}
        <GlobalSearch />

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">

          {/* Create */}
          <button
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0"
            style={{ backgroundColor: "#7A0E42" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5e0a31")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7A0E42")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create</span>
          </button>

          {/* Help */}
          <button
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Help"
          >
            <Ic d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </button>

          {/* ── Notifications ── */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              aria-expanded={notifOpen}
              className="relative w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Ic d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"]} />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold border-2 border-white"
                  style={{ backgroundColor: "#7A0E42" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-[340px] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                            className="text-xs font-semibold hover:underline"
                            style={{ color: "#7A0E42" }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-gray-50 overflow-y-auto scrollbar-brand" style={{ maxHeight: 340 }}>
                  {loading ? (
                    <li className="px-5 py-8 flex justify-center">
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                           style={{ borderColor: "#7A0E42", borderTopColor: "transparent" }} />
                    </li>
                  ) : notifications.length === 0 ? (
                    <li className="px-5 py-8 text-center text-sm text-gray-400">You're all caught up!</li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id} onClick={() => handleNotifClick(n)}
                          className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50"
                          style={!n.isRead ? { backgroundColor: "rgba(122,14,66,0.04)" } : {}}>
                        <span className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: !n.isRead ? "#7A0E42" : "transparent" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                          {timeAgo(n.createdAt)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                {notifications.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 text-center">
                    <button
                      onClick={() => { setNotifOpen(false); if (notifications[0]) handleNotifClick(notifications[0]); }}
                      className="text-sm font-semibold hover:underline" style={{ color: "#7A0E42" }}>
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Settings gear ── */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Dashboard settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* ── Avatar + user dropdown ── */}
          <div ref={userRef} className="relative">
            <button onClick={() => setUserOpen((v) => !v)} aria-label="User menu"
                    aria-expanded={userOpen}
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 rounded-lg px-1.5 py-1 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden"
                   style={{ backgroundColor: "#7A0E42" }}>
                {resolveUploadUrl(user?.profilePhotoUrl)
                  ? <img src={resolveUploadUrl(user?.profilePhotoUrl)} alt={initials} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round"
                   className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${userOpen ? "rotate-180" : ""}`}
                   aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.name ?? "Admin"}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email ?? ""}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide text-white"
                        style={{ backgroundColor: "#7A0E42" }}>
                    Administrator
                  </span>
                </div>
                <div className="py-1">
                  <button onClick={() => { setUserOpen(false); navigate("/admin/profile"); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    Profile
                  </button>
                  <button onClick={() => { setUserOpen(false); setSettingsOpen(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    Dashboard Settings
                  </button>
                  <button onClick={() => { setUserOpen(false); navigate("/admin/settings"); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    Account Settings
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={() => { setUserOpen(false); logout(); navigate("/auth/admin"); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminTopBar;
