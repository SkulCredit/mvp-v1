import React, { ReactNode } from "react";

interface SidebarShellProps {
  logo: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
  widthCls?: string;
  className?: string;
}

const SidebarShell: React.FC<SidebarShellProps> = ({
  logo,
  nav,
  footer,
  widthCls = "w-[300px]",
  className = "",
}) => (
  <aside
    className={`${widthCls} bg-white border-r border-slate-200 hidden md:flex flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 ${className}`}
  >
    <div className="h-20 flex items-center px-6 shrink-0">{logo}</div>
    <nav className="flex-1 overflow-y-auto scrollbar-brand px-4 py-5 space-y-1">
      {nav}
    </nav>
    <div className="shrink-0 border-t border-slate-100">{footer}</div>
  </aside>
);

export default SidebarShell;
