import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDashboardSettings } from "../../pages/AdminFlow/components/DashboardSettingsDrawer";
import { resolveUploadUrl } from "../../utils/uploadUrl";

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: string;   
  path?: string;  
  children?: NavChild[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const P = {
  dashboard:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  customers:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  applications: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  loans:        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  schools:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  funding:      "M3 9h18M3 15h18M12 3v18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  kyc:          "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  compliance:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  support:      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  audit:        "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  analytics:    "M18 20V10M12 20V4M6 20v-6",
  users:        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  settings:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.071-4.243a7 7 0 0 0-.08-.83l1.8-1.41-1-1.73-2.11.7a7 7 0 0 0-1.43-.83L16 5h-2l-.26 2.11a7 7 0 0 0-1.43.83l-2.11-.7-1 1.73 1.8 1.41a7 7 0 0 0-.08.83 7 7 0 0 0 .08.83l-1.8 1.41 1 1.73 2.11-.7a7 7 0 0 0 1.43.83L14 19h2l.26-2.11a7 7 0 0 0 1.43-.83l2.11.7 1-1.73-1.8-1.41a7 7 0 0 0 .08-.85z",
};

const NAV: NavSection[] = [
  {
    title: "HOME",
    items: [
      { label: "Dashboard", icon: P.dashboard, path: "/admin/dashboard" },
    ],
  },
  {
    title: "CUSTOMERS",
    items: [
      {
        label: "Customer Management",
        icon: P.customers,
        children: [
          { label: "Schools",  path: "/admin/schools"  },
          { label: "Parents",  path: "/admin/parents"  },
        ],
      },
      {
        label: "Applications",
        icon: P.applications,
        children: [
          { label: "All Applications", path: "/admin/applications" },
        ],
      },

    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Funding Partners",
        icon: P.funding,
        children: [
          { label: "Partners List",         path: "/admin/funding-partners"          },
          { label: "Disbursement Requests", path: "/admin/funding-partners/requests" },
        ],
      },
    ],
  },
  {
    title: "BACK OFFICE",
    items: [
      { label: "Compliance",   icon: P.compliance, path: "/admin/compliance" },
      { label: "Support",      icon: P.support,    path: "/admin/support"    },
      { label: "Audit Log",    icon: P.audit,      path: "/admin/audit"      },
      { label: "Analytics",    icon: P.analytics,  path: "/admin/analytics"  },
      {
        label: "Users & Roles",
        icon: P.users,
        children: [
          { label: "Admin Users", path: "/admin/users"       },
          { label: "Roles",       path: "/admin/users/roles" },
        ],
      },
      { label: "Settings",     icon: P.settings,   path: "/admin/settings"   },
    ],
  },
];

const Icon: React.FC<{ d: string; size?: number }> = ({ d, size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d={d} />
  </svg>
);

const ChevronRight: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface NavRowProps {
  item: NavItem;
  collapsed: boolean;
  isOpen?: boolean;
  onToggle?: (label: string) => void;
  navStyle?: "tree" | "flat";
}

const NavRow: React.FC<NavRowProps> = ({ item, collapsed, isOpen, onToggle, navStyle = "tree" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasChildren = navStyle === "tree" && !!item.children?.length;

  const isLeafActive = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    : false;

  const isChildActive = item.children?.some((c) => {
    if (c.path === "/admin/applications") {
      // "All Applications" is only active when there is no query string
      return location.pathname === "/admin/applications" && !location.search;
    }
    if (c.path.includes("?")) {
      return (location.pathname + location.search) === c.path;
    }
    return location.pathname === c.path || location.pathname.startsWith(c.path + "/");
  }) ?? false;

  const isActive = isLeafActive || isChildActive;

  const handleClick = () => {
    if (hasChildren) {
      onToggle?.(item.label);
    } else if (item.path) {
      navigate(item.path);
    } else if (item.children?.[0]) {
      navigate(item.children[0].path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        aria-expanded={hasChildren ? (isOpen ?? false) : undefined}
        className={[
          "w-full flex items-center rounded-lg transition-colors duration-150 group",
          collapsed
            ? "justify-center p-2.5 my-0.5"
            : "gap-2.5 px-3 py-2 my-0.5",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <Icon d={item.icon} size={15} />

        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[13px] font-medium leading-snug truncate">
              {item.label}
            </span>
            {hasChildren && <ChevronRight open={isOpen ?? false} />}
          </>
        )}
      </button>

      {!collapsed && hasChildren && (isOpen ?? false) && (
        <div className="ml-4 pl-3 border-l border-white/15 mt-0.5 mb-1 flex flex-col gap-0.5">
          {item.children!.map((child) => {
            let childActive: boolean;
            if (child.path === "/admin/applications") {
              // "All Applications" — active only when no query string present
              childActive = location.pathname === "/admin/applications" && !location.search;
            } else if (child.path.includes("?")) {
              childActive = (location.pathname + location.search) === child.path;
            } else {
              childActive =
                location.pathname === child.path ||
                location.pathname.startsWith(child.path + "/");
            }
            return (
              <button
                key={child.path}
                onClick={() => navigate(child.path)}
                className={[
                  "w-full text-left text-[12px] px-2.5 py-1.5 rounded-md transition-colors duration-150",
                  childActive
                    ? "text-white font-semibold bg-white/10"
                    : "text-white/55 hover:text-white hover:bg-white/8",
                ].join(" ")}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CollapseIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    {collapsed ? (
      /* panel-right-open style: lines pointing right */
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <polyline points="13 9 17 12 13 15" />
      </>
    ) : (
      /* panel-left-close style: lines pointing left */
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <polyline points="15 9 11 12 15 15" />
      </>
    )}
  </svg>
);

interface SidebarInnerProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onClose?: () => void;
}

const SidebarInner: React.FC<SidebarInnerProps> = ({
  collapsed = false,
  onCollapsedChange,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useDashboardSettings();
  const bgColor  = ctx?.settings?.sidebarBgColor  ?? "#7A0E42";
  const navStyle = ctx?.settings?.sidebarNavStyle  ?? "tree";

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "AD";

  const isChildPathActive = (item: NavItem) =>
    item.children?.some((c) => {
      if (c.path === "/admin/applications") {
        return location.pathname === "/admin/applications" && !location.search;
      }
      if (c.path.includes("?")) {
        return (location.pathname + location.search) === c.path;
      }
      return (
        location.pathname === c.path ||
        location.pathname.startsWith(c.path + "/")
      );
    }) ?? false;

  const [openItem, setOpenItem] = React.useState<string | null>(() => {
    for (const section of NAV) {
      for (const item of section.items) {
        if (isChildPathActive(item)) return item.label;
      }
    }
    return null;
  });

  React.useEffect(() => {
    for (const section of NAV) {
      for (const item of section.items) {
        if (isChildPathActive(item)) {
          setOpenItem(item.label);
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleToggle = (label: string) => {
    setOpenItem((prev) => (prev === label ? null : label));
  };

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className={[
          "flex items-center shrink-0 py-4",
          collapsed ? "justify-center px-2" : "px-4 gap-2.5",
        ].join(" ")}
      >
        {!collapsed && (
          <img src="/logo_white.png" alt="SkulCredit" className="h-8 w-auto shrink-0" />
        )}
        {!collapsed && <div className="flex-1 min-w-0" />}
        {onCollapsedChange && (
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-white/50 hover:text-white transition-colors rounded p-0.5 shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      <div className="w-full h-px bg-white/10 shrink-0" />

      <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-sidebar">
        {NAV.map((section) => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-white/35 select-none">
                {section.title}
              </p>
            )}
            {collapsed && (
              <div className="my-2 mx-auto w-5 h-px bg-white/20" />
            )}

            {section.items.map((item) => (
              <NavRow
                key={item.label}
                item={item}
                collapsed={collapsed}
                isOpen={openItem === item.label}
                onToggle={handleToggle}
                navStyle={navStyle}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="w-full h-px bg-white/10 shrink-0" />

      <div className={collapsed ? "py-3 px-1" : "py-3 px-3"}>
        <button
          onClick={() => {
            logout();
            navigate("/auth/admin");
            onClose?.();
          }}
          title={collapsed ? "Logout" : undefined}
          className={[
            "w-full flex items-center hover:bg-white/10 rounded-lg transition-colors cursor-pointer",
            collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-2",
          ].join(" ")}
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-bold shrink-0 overflow-hidden">
            {resolveUploadUrl(user?.profilePhotoUrl)
              ? <img src={resolveUploadUrl(user?.profilePhotoUrl)} alt={initials} className="w-full h-full object-cover" />
              : initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-white text-[12px] font-semibold truncate">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-white/40 text-[10px] truncate">
                {user?.email ?? ""}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[240px] shadow-2xl">
            <SidebarInner onClose={onMobileClose} />
          </div>
        </div>
      )}

      {/* Desktop sidebar — user-controlled collapse */}
      <div
        className={[
          "hidden md:flex shrink-0 h-full transition-all duration-300",
          collapsed ? "w-14" : "w-[240px]",
        ].join(" ")}
      >
        <SidebarInner
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </div>
    </>
  );
};

export default AdminSidebar;
