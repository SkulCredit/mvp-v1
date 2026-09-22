import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import SidebarShell from "./SidebarShell";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/school/dashboard", icon: "layout-dashboard", label: "Dashboard" },
  { to: "/school/students", icon: "graduation-cap", label: "Students" },
  { to: "/school/applications", icon: "file-text", label: "Applications" },
  { to: "/school/disbursement", icon: "credit-card", label: "Disbursement" },
  { to: "/school/settings", icon: "shield-check", label: "Verification" },
  { to: "/school/support", icon: "headset", label: "Support" },
];

const navCls = (active: boolean) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
    active
      ? "bg-brand text-white shadow-[0_4px_12px_rgba(136,19,55,0.2)]"
      : "text-slate-700 hover:bg-slate-50 hover:text-brand"
  }`;

const LogoSlot: React.FC = () => (
  <Link
    to="/"
    className="flex items-center gap-2 hover:opacity-90 transition-opacity"
  >
    <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
  </Link>
);

interface NavListProps {
  onNavClick?: () => void;
  onLogout: () => void;
}

const NavList: React.FC<NavListProps> = ({ onNavClick, onLogout }) => (
  <div className="flex flex-col gap-0.5">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/school/dashboard"}
        onClick={onNavClick}
        className={({ isActive }) => navCls(isActive)}
      >
        {({ isActive }) => (
          <>
            <Icon
              name={icon}
              className={`w-5 h-5 shrink-0 ${
                isActive
                  ? ""
                  : "text-slate-500 group-hover:text-brand transition-colors"
              }`}
            />
            {label}
          </>
        )}
      </NavLink>
    ))}
  </div>
);

export interface SchoolSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SchoolSidebar: React.FC<SchoolSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/school");
  };

  const Footer = (
    <>
      <NavLink
        to="/school/account-settings"
        className={({ isActive }) => navCls(isActive)}
        onClick={onMobileClose}
      >
        {({ isActive }) => (
          <>
            <Icon
              name="settings"
              className={`w-5 h-5 shrink-0 ${
                isActive
                  ? ""
                  : "text-slate-500 group-hover:text-brand transition-colors"
              }`}
            />
            Settings
          </>
        )}
      </NavLink>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 font-semibold hover:bg-red-50 hover:text-red-600 transition-all group"
      >
        <Icon
          name="log-out"
          className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-red-600 transition-colors"
        />
        Logout
      </button>

      <div className="flex items-center gap-3 px-4 py-3 mt-1 border-t border-slate-100">
        <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
          {(user?.name ?? "SC").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {user?.name ?? "School Admin"}
          </p>
          <p className="text-xs text-slate-500">Partner Portal</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <SidebarShell
        logo={<LogoSlot />}
        nav={<NavList onLogout={handleLogout} />}
        footer={Footer}
      />

      <div
        className={`md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-[300px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 h-20">
          <LogoSlot />
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-brand px-4 py-5 space-y-1">
          <NavList onNavClick={onMobileClose} onLogout={handleLogout} />
        </nav>
        <div className="border-t border-slate-100 px-4 py-3 shrink-0 space-y-0.5">
          {Footer}
        </div>
      </div>
    </>
  );
};

export default SchoolSidebar;
