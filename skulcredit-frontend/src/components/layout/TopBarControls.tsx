import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { useAuth } from "../../context/AuthContext";

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

const NotificationDropdown: React.FC<{
  notifications: Notification[];
  unreadCount: number;
}> = ({ notifications, unreadCount }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
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
                     border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-brand/10 text-brand text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <ul
            className="divide-y divide-slate-50 overflow-y-auto scrollbar-brand"
            style={{ maxHeight: "340px" }}
          >
            {notifications.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-slate-400">
                You're all caught up!
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.unread ? "bg-brand" : "bg-transparent"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                    {n.time}
                  </span>
                </li>
              ))
            )}
          </ul>
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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

  const MENU_ITEMS: {
    icon: string;
    label: string;
    onClick?: () => void;
    danger?: boolean;
  }[] = [
    { icon: "user", label: "View Profile" },
    { icon: "settings", label: "Settings" },
    { icon: "headphones", label: "Help & Support" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-brand/40 rounded-full"
      >
        <div
          className="w-9 h-9 rounded-full bg-brand flex items-center justify-center
                     text-white shrink-0 shadow-sm select-none"
        >
          <Icon name="user" className="w-5 h-5" />
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
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{email}</p>
          </div>
          <ul className="py-1">
            {MENU_ITEMS.map(({ icon, label }) => (
              <li key={label}>
                <button
                  onClick={() => setOpen(false)}
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

const TopBarControls: React.FC<TopBarControlsProps> = ({
  notifications = [],
}) => {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="flex items-center gap-3">
      <NotificationDropdown
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <UserDropdown />
    </div>
  );
};

export default TopBarControls;
