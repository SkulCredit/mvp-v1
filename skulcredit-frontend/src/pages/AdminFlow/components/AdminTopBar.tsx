import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/Icon";
import { useAuth } from "../../../context/AuthContext";

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

const AdminTopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setOpen(false));

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/auth");
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-6 shrink-0 z-10">
      <div className="flex items-center gap-2 flex-1 max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <Icon name="search" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          placeholder="Search applicants, loans, schools..."
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">
            System Live
          </span>
        </div>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <Icon name="bell" className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#881337] rounded-full" />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={open}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337]/40"
          >
            <div className="w-7 h-7 rounded-full bg-[#881337]/10 flex items-center justify-center text-[#881337] font-bold text-xs shrink-0">
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
              {user?.name ?? "Admin"}
            </span>
            <Icon
              name="chevron-down"
              className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden py-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {user?.name ?? "Admin"}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {user?.email ?? ""}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#881337]/10 text-[#881337] text-[10px] font-bold rounded-full uppercase tracking-wide">
                  Administrator
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                             hover:bg-slate-50 hover:text-[#881337] transition-colors text-left"
                >
                  <Icon
                    name="user"
                    className="w-4 h-4 text-slate-400 shrink-0"
                  />
                  Profile
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                             hover:bg-slate-50 hover:text-[#881337] transition-colors text-left"
                >
                  <Icon
                    name="settings"
                    className="w-4 h-4 text-slate-400 shrink-0"
                  />
                  Settings
                </button>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold
                             text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <Icon name="log-out" className="w-4 h-4 shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
