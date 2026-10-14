import React, { ReactNode } from "react";
import ChatBot from "../ChatBot";
import { useDashboardSettings } from "../../pages/AdminFlow/components/DashboardSettingsDrawer";

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  bgDecorations?: ReactNode;
  useSettings?: boolean;
  showChatBot?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  header,
  children,
  bgDecorations,
  useSettings = false,
  showChatBot = true,
}) => {
  const ctx = useSettings ? useDashboardSettings() : null; 
  const settings = ctx?.settings;

  const bgColor         = settings?.bgColor ?? "#F8FAFC";
  const sidebarVisible  = settings?.sidebarVisible ?? true;
  const sidebarPosition = settings?.sidebarPosition ?? "left";
  const contentMaxW     = settings?.contentWidth === "full" ? "" : "";

  const sidebarEl = sidebarVisible ? sidebar : null;

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans relative"
      style={{ backgroundColor: bgColor }}
    >
      {bgDecorations}

      {sidebarPosition === "left" && sidebarEl}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 min-w-0">
        {header}
        <main
          className="flex-1 overflow-y-auto scrollbar-brand px-4 sm:px-6 md:px-8 lg:px-10 pb-12"
          style={{ backgroundColor: bgColor }}
        >
          {children}
        </main>
      </div>
      {sidebarPosition === "right" && sidebarEl}

      {showChatBot && <ChatBot />}
    </div>
  );
};

export default DashboardLayout;
