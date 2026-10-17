import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NEW_FINANCE_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", path: "/finance/dashboard" },
    ],
  },
  {
    title: "LENDING",
    items: [
      { id: "disbursements", label: "Disbursements", path: "/finance/disbursements" },
      { id: "repayments-collections", label: "Repayments & collections", path: "/finance/repayments" },
      { id: "overdue-accounts", label: "Overdue accounts", path: "/finance/repayments/overdue" },
      { id: "collection-follow-up", label: "Collection follow-up", path: "/finance/repayments/follow-up" },
    ],
  },
  {
    title: "CONTROLS",
    items: [
      { id: "reconciliation", label: "Reconciliation", path: "/finance/reconciliation" },
      { id: "financial-reports", label: "Financial reports", path: "/finance/reports" },
      { id: "schools-loan-records", label: "Schools & loan records", path: "/finance/records/schools" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "audit-logs-settings", label: "Audit logs & settings", path: "/finance/settings" },
    ],
  },
];

const FinanceSidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === "/finance/dashboard" && (location.pathname === "/finance" || location.pathname === "/finance/dashboard")) {
      return true;
    }
    if (path === "/finance/disbursements" && (location.pathname.startsWith("/finance/disbursements") && !location.pathname.includes("verification"))) {
      return true;
    }
    if (path === "/finance/repayments" && (location.pathname === "/finance/repayments" || location.pathname === "/finance/repayments/history")) {
      return true;
    }
    if (path === "/finance/records/schools" && location.pathname.startsWith("/finance/records")) {
      return true;
    }
    return location.pathname === path;
  };

  const content = (
    <div className="flex flex-col h-full bg-[#520024] text-white select-none overflow-hidden justify-between">
      {/* Brand & Nav Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-6 flex items-center justify-between border-b border-white/5">
          <Link to="/finance/dashboard" className="block">
            <span className="text-xl font-extrabold tracking-tight text-white block lowercase leading-none font-sans">
              skulcredit
            </span>
            <span className="text-[10px] text-pink-200/60 font-semibold tracking-wider uppercase block mt-1.5">
              FINANCE WORKSPACE
            </span>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-white/70 hover:text-white p-1 rounded-md"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-pink-950">
          {NEW_FINANCE_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-pink-200/50">
                {section.title}
              </h3>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isCurrent(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onMobileClose}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] transition-all ${
                        active
                          ? "bg-[#9b0d4d] text-white font-bold shadow-xs"
                          : "text-white/80 hover:text-white hover:bg-white/5 font-medium"
                      }`}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                      <span className={active ? "" : "ml-0"}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile Area */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3 shrink-0 bg-[#42001c]">
        <div className="w-9 h-9 rounded-full bg-[#9b0d4d] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/20">
          FO
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-white block truncate leading-tight">
            Finance Officer
          </span>
          <span className="text-[10px] text-pink-200/60 block truncate mt-0.5">
            Finance access · Level 1
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen shrink-0 border-r border-black/10 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in-left">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default FinanceSidebar;
