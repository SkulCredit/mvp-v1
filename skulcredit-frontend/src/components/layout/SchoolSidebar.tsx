import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Icon from "../Icon";
import SidebarShell from "./SidebarShell";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/school/dashboard", icon: "layout-dashboard", label: "Dashboard" },
  { to: "/school/students", icon: "graduation-cap", label: "Students" },
  { to: "/school/applications", icon: "file-text", label: "Applications" },
  { to: "/school/disbursement", icon: "credit-card", label: "Disbursement" },
  { to: "/school/settings", icon: "shield-check", label: "Verification" },
  { to: "/school/support", icon: "headset", label: "Support" },
];

const SchoolSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    logout();
    navigate("/auth/school");
  };

  const linkCls = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
      isActive(path)
        ? "bg-brand text-white shadow-[0_4px_12px_rgba(136,19,55,0.2)]"
        : "text-slate-700 hover:bg-slate-50 hover:text-brand"
    }`;

  return (
    <SidebarShell
      logo={
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
        </Link>
      }
      nav={
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.slice(0, 5).map(({ to, icon, label }) => (
            <Link key={to} to={to} className={linkCls(to)}>
              <Icon
                name={icon}
                className={`w-5 h-5 ${isActive(to) ? "" : "text-slate-500 group-hover:text-brand transition-colors"}`}
              />
              {label}
            </Link>
          ))}

          {/* divider before Support */}
          <div className="my-2 border-t border-slate-100" />

          <Link to="/school/support" className={linkCls("/school/support")}>
            <Icon
              name="headset"
              className={`w-5 h-5 ${isActive("/school/support") ? "" : "text-slate-500 group-hover:text-brand transition-colors"}`}
            />
            Support
          </Link>
        </div>
      }
      footer={
        <>
          <Link
            to="/school/account-settings"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-all group"
          >
            <Icon
              name="settings"
              className="w-5 h-5 text-slate-500 group-hover:text-brand transition-colors"
            />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 font-semibold hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <Icon
              name="log-out"
              className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors"
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
      }
    />
  );
};

export default SchoolSidebar;
