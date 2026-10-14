import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import SidebarShell from "./SidebarShell";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS: { path: string; icon: string; label: string }[] = [
  { path: "/parent/dashboard", icon: "layout-dashboard", label: "Dashboard" },
  { path: "/parent/applications", icon: "file-text", label: "Applications" },
  { path: "/parent/repayment", icon: "credit-card", label: "Repayment" },
  { path: "/parent/verification", icon: "shield-check", label: "Verification" },
  { path: "/parent/support", icon: "headphones", label: "Support" },
  { path: "/parent/settings", icon: "settings", label: "Settings" },
];

export interface ParentSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navCls = (active: boolean) =>
  `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all group ${
    active
      ? "bg-brand text-white shadow-[0_4px_12px_rgba(136,19,55,0.2)]"
      : "text-slate-600 hover:bg-slate-50 hover:text-brand"
  }`;

const LogoSlot: React.FC = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1C53]/50 rounded"
    aria-label="SkulCredit home"
  >
    <img src="/logo.svg" alt="SkulCredit logo" className="h-14 w-auto" />
  </Link>
);

const HelpCard: React.FC = () => (
  <div className="mx-3 mb-3 rounded-xl bg-[#8B1C53]/10 px-4 py-4 flex flex-col items-start gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B1C53] shrink-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-white"
        aria-hidden="true"
      >
        <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
        <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 1-8.105 2.571.75.75 0 0 1-.832-.572 48.927 48.927 0 0 0 1.476-4.712ZM11.33 15.473a48.45 48.45 0 0 0-7.666-3.282 48.927 48.927 0 0 1 1.476 4.712.75.75 0 0 1-.832.572 47.87 47.87 0 0 1-8.105-2.571.75.75 0 0 1-.46-.711c.035-1.441.12-2.87.255-4.284a48.45 48.45 0 0 1 7.666 3.282c.134 1.414.22 2.843.255 4.284Z" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        Need help with your application?
      </p>
      <p className="mt-1 text-xs text-[#8B1C53]/70 leading-relaxed">
        Our support team is here to help you with every step of the way.
      </p>
    </div>
    <button className="flex items-center gap-2 rounded-lg bg-[#8B1C53] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7a1848] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1C53] focus-visible:ring-offset-1">
      Contact Support
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  </div>
);

interface NavListProps {
  onNavClick?: () => void;
  onLogout: () => void;
}

const NavList: React.FC<NavListProps> = ({ onNavClick, onLogout }) => (
  <>
    {NAV_ITEMS.map(({ path, icon, label }) => (
      <NavLink
        key={path}
        to={path}
        end={path === "/parent/dashboard"}
        onClick={onNavClick}
        className={({ isActive }) => navCls(isActive)}
      >
        {({ isActive }) => (
          <>
            <Icon
              name={icon}
              className={`w-[18px] h-[18px] shrink-0 ${
                isActive ? "" : "text-slate-400 group-hover:text-brand"
              }`}
            />
            {label}
          </>
        )}
      </NavLink>
    ))}

    <button
      onClick={onLogout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group"
    >
      <Icon
        name="log-out"
        className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-red-500 transition-colors"
      />
      Logout
    </button>
  </>
);

const ParentSidebar: React.FC<ParentSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <>
      <SidebarShell
        logo={<LogoSlot />}
        nav={<NavList onLogout={handleLogout} />}
        footer={
          <div className="pt-3 pb-2">
            <HelpCard />
          </div>
        }
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
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
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
        <div className="border-t border-slate-100 pt-3 pb-3 shrink-0">
          <HelpCard />
        </div>
      </div>
    </>
  );
};

export default ParentSidebar;
export type ParentTab =
  | "dashboard"
  | "applications"
  | "repayment"
  | "verification"
  | "support";
