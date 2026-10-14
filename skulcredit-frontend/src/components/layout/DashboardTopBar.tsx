import React, { ReactNode } from "react";
import Icon from "../Icon";

interface DashboardTopBarProps {
  left?: ReactNode;
  notificationCount?: number;
  rightExtra?: ReactNode;
  heightCls?: string;
  className?: string;
  onMobileMenuOpen?: () => void;
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  left,
  notificationCount = 0,
  rightExtra,
  heightCls = "h-20",
  className = "",
  onMobileMenuOpen,
}) => (
  <header
    className={`${heightCls} bg-white border-b border-slate-200 flex items-center gap-3 px-6 md:px-10 py-4 z-10 shrink-0 ${className}`}
  >
    {onMobileMenuOpen && (
      <button
        aria-label="Open navigation"
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>
    )}
    {left && <div className="flex-1 min-w-0">{left}</div>}
    <div className="flex items-center gap-3 ml-auto shrink-0">{rightExtra}</div>
  </header>
);

export default DashboardTopBar;
