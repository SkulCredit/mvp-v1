import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BRAND = "#7A0E42";

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: string;
  path?: string;
  badge?: number;
  children?: NavChild[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const P = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  issues:      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  applications:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  schools:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  parents:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  escalations: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  knowledge:   "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  reports:     "M18 20V10M12 20V4M6 20v-6",
  profile:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout:      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const NAV: NavSection[] = [
  {
    title: "CUSTOMER SERVICE",
    items: [
      { label: "Dashboard",      icon: P.dashboard,    path: "/cs/dashboard" },
      { label: "Manage Issues",  icon: P.issues,       path: "/cs/issues"    },
      {
        label: "Applications",
        icon: P.applications,
        children: [
          { label: "All Applications", path: "/cs/applications" },
        ],
      },
      {
        label: "Schools",
        icon: P.schools,
        children: [
          { label: "All Schools", path: "/cs/schools" },
        ],
      },
      {
        label: "Parents",
        icon: P.parents,
        children: [
          { label: "All Parents", path: "/cs/parents" },
        ],
      },
      { label: "Escalations",   icon: P.escalations,  path: "/cs/escalations" },
      { label: "Knowledge Base", icon: P.knowledge,   path: "/cs/knowledge"   },
      { label: "Reports",        icon: P.reports,     path: "/cs/reports"     },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Profile", icon: P.profile, path: "/cs/profile" },
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
}

const NavRow: React.FC<NavRowProps> = ({ item, collapsed, isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasChildren = !!item.children?.length;

  const isLeafActive = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    : false;

  const isChildActive =
    item.children?.some(
      (c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"),
    ) ?? false;

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
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {item.badge}
              </span>
            )}
            {hasChildren && <ChevronRight open={isOpen ?? false} />}
          </>
        )}
      </button>

      {!collapsed && hasChildren && (isOpen ?? false) && (
        <div className="ml-4 pl-3 border-l border-white/15 mt-0.5 mb-1 flex flex-col gap-0.5">
          {item.children!.map((child) => {
            const childActive =
              location.pathname === child.path ||
              location.pathname.startsWith(child.path + "/");
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
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <polyline points="13 9 17 12 13 15" />
      </>
    ) : (
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

const SidebarInner: React.FC<SidebarInnerProps> = ({ collapsed = false, onCollapsedChange, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "CS";

  const isChildPathActive = (item: NavItem) =>
    item.children?.some(
      (c) =>
        location.pathname === c.path ||
        location.pathname.startsWith(c.path + "/"),
    ) ?? false;

  const [openItem, setOpenItem] = React.useState<string | null>(() => {
    for (const section of NAV) {
      for (const item of section.items) {
        if (
          item.children?.some(
            (c) =>
              location.pathname === c.path ||
              location.pathname.startsWith(c.path + "/"),
          )
        ) {
          return item.label;
        }
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
      style={{ backgroundColor: BRAND }}
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
            navigate("/auth/staff");
            onClose?.();
          }}
          title={collapsed ? "Logout" : undefined}
          className={[
            "w-full flex items-center hover:bg-white/10 rounded-lg transition-colors cursor-pointer",
            collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-2",
          ].join(" ")}
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-bold shrink-0 overflow-hidden">
            {user?.profilePhotoUrl
              ? <img src={user.profilePhotoUrl} alt={initials} className="w-full h-full object-cover" />
              : initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-white text-[12px] font-semibold truncate">
                {user?.name ?? "Customer Service"}
              </p>
              <p className="text-white/40 text-[10px] truncate">{user?.email ?? ""}</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export interface CSSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const CSSidebar: React.FC<CSSidebarProps> = ({
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

export default CSSidebar;
