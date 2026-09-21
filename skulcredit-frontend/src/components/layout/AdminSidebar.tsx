import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Icon from "../Icon";
import SidebarShell from "./SidebarShell";
import { useAuth } from "../../context/AuthContext";

export type AdminTab =
  | "dashboard"
  | "applications"
  | "disbursements"
  | "repayments"
  | "schools"
  | "risk"
  | "compliance"
  | "audit"
  | "reports"
  | "analytics";

interface NavItem {
  tab: AdminTab;
  icon: string;
  label: string;
  path: string;
}

const OVERVIEW_NAV: NavItem[] = [
  {
    tab: "dashboard",
    icon: "layout-dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    tab: "applications",
    icon: "file-text",
    label: "Applications",
    path: "/admin/applications",
  },
];

const OPERATIONS_NAV: NavItem[] = [
  {
    tab: "disbursements",
    icon: "send",
    label: "Disbursements",
    path: "/admin/disbursements",
  },
  {
    tab: "repayments",
    icon: "refresh-cw",
    label: "Repayments & Collections",
    path: "/admin/repayments",
  },
  {
    tab: "schools",
    icon: "building-2",
    label: "Schools",
    path: "/admin/schools",
  },
];

const RISK_NAV: NavItem[] = [
  {
    tab: "risk",
    icon: "shield",
    label: "Risk & Underwriting",
    path: "/admin/risk",
  },
  {
    tab: "compliance",
    icon: "check-circle",
    label: "Compliance",
    path: "/admin/compliance",
  },
  {
    tab: "audit",
    icon: "activity",
    label: "Audit & Activity Logs",
    path: "/admin/audit",
  },
];

const INSIGHTS_NAV: NavItem[] = [
  {
    tab: "reports",
    icon: "bar-chart-2",
    label: "Reports",
    path: "/admin/reports",
  },
  {
    tab: "analytics",
    icon: "trending-up",
    label: "Analytics",
    path: "/admin/analytics",
  },
];

interface AdminSidebarProps {
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isActive = (item: NavItem) => {
    if (activeTab) return activeTab === item.tab;
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
    );
  };

  const handleClick = (item: NavItem) => {
    if (onTabChange) {
      onTabChange(item.tab);
    } else {
      navigate(item.path);
    }
  };

  const btnCls = (item: NavItem) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
      isActive(item)
        ? "bg-[#881337]/10 text-[#881337]"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
    }`;

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-1">
      <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-4">
        {label}
      </p>
      {items.map((item) => (
        <button
          key={item.tab}
          onClick={() => handleClick(item)}
          className={btnCls(item)}
        >
          <Icon name={item.icon} className="w-4 h-4 shrink-0" />
          <span className="leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "FA";

  return (
    <SidebarShell
      widthCls="w-[240px]"
      logo={
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
        </Link>
      }
      nav={
        <div>
          {renderGroup("Overview", OVERVIEW_NAV)}
          {renderGroup("Operations", OPERATIONS_NAV)}
          {renderGroup("Risk & Compliance", RISK_NAV)}
          {renderGroup("Insights", INSIGHTS_NAV)}
        </div>
      }
      footer={
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#881337]/10 flex items-center justify-center text-[#881337] font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name ?? "Fashanu Ayomide"}
              </p>
              <p className="text-xs text-slate-500">Operations Admin</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
            >
              <Icon name="log-out" className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    />
  );
};

export default AdminSidebar;
