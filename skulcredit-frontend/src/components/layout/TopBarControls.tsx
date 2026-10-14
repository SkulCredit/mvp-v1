import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { resolveUploadUrl } from "../../utils/uploadUrl";
import NotificationDrawer from "../notifications/NotificationDrawer";
import { AppNotification } from "../../services/notificationService";

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

export interface TopBarControlsProps {
  notifications?: Notification[];
}

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
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNotification, setActiveNotification] =
    useState<AppNotification | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  const handleNotificationClick = (n: AppNotification) => {
    setActiveNotification(n);
    setDrawerOpen(true);
    setOpen(false);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleViewAll = () => {
    setOpen(false);
    if (notifications.length > 0) {
      setActiveNotification(notifications[0]);
      setDrawerOpen(true);
    }
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          aria-label="Notifications"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative p-2.5 rounded-xl border border-slate-200 text-slate-500
                     hover:text-brand hover:bg-slate-50 transition-colors focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Icon name="bell" className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center
                         justify-center rounded-full bg-brand text-white text-[10px] font-bold leading-none
                         border-2 border-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-[340px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                       border border-slate-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-brand hover:underline transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ul
              className="divide-y divide-slate-50 overflow-y-auto scrollbar-brand"
              style={{ maxHeight: "340px" }}
            >
              {loading ? (
                <li className="px-5 py-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </li>
              ) : notifications.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-slate-400">
                  You're all caught up!
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 px-5 py-4 transition-colors cursor-pointer
                      ${n.isRead ? "hover:bg-slate-50" : "bg-brand/5 hover:bg-brand/10"}`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        !n.isRead ? "bg-brand" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </li>
                ))
              )}
            </ul>

            {notifications.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <button
                  onClick={handleViewAll}
                  className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationDrawer
        notification={activeNotification}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onMarkRead={markRead}
      />
    </>
  );
};

const UserDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name ?? user?.firstName ?? "User";
  const email = user?.email ?? "";
  const photo = resolveUploadUrl(user?.profilePhotoUrl);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/auth");
  };

  const role = user?.role ?? "parent";

  const MENU_ITEMS: { icon: string; label: string; to: string }[] =
    role === "school"
      ? [
          {
            icon: "user",
            label: "View Profile",
            to: "/school/account-settings",
          },
          {
            icon: "settings",
            label: "Settings",
            to: "/school/account-settings",
          },
          {
            icon: "headphones",
            label: "Help & Support",
            to: "/school/support",
          },
        ]
      : role === "admin"
        ? [
            { icon: "user", label: "View Profile", to: "/admin/dashboard" },
            { icon: "settings", label: "Settings", to: "/admin/dashboard" },
            {
              icon: "headphones",
              label: "Help & Support",
              to: "/admin/dashboard",
            },
          ]
        : [
            { icon: "user", label: "View Profile", to: "/parent/settings" },
            { icon: "settings", label: "Settings", to: "/parent/settings" },
            {
              icon: "headphones",
              label: "Help & Support",
              to: "/parent/support",
            },
          ];

  const handleMenuClick = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-brand/40 rounded-full"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-sm select-none bg-brand flex items-center justify-center">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-white text-sm font-bold leading-none">
              {initials || <Icon name="user" className="w-5 h-5 text-white" />}
            </span>
          )}
        </div>
        <Icon
          name="chevron-down"
          className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                     border border-slate-100 z-50 overflow-hidden py-1"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-brand flex items-center justify-center">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {name}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{email}</p>
            </div>
          </div>
          <ul className="py-1">
            {MENU_ITEMS.map(({ icon, label, to }) => (
              <li key={label}>
                <button
                  onClick={() => handleMenuClick(to)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                             hover:bg-slate-50 hover:text-brand transition-colors text-left"
                >
                  <Icon
                    name={icon}
                    className="w-4 h-4 text-slate-400 shrink-0"
                  />
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                         hover:bg-red-50 transition-colors text-left"
            >
              <Icon name="log-out" className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TopBarControls: React.FC<TopBarControlsProps> = () => {
  return (
    <div className="flex items-center gap-3">
      <NotificationDropdown />
      <UserDropdown />
    </div>
  );
};

export default TopBarControls;
