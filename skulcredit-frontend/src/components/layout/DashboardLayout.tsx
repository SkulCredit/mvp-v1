import React, { ReactNode } from "react";
import ChatBot from "../ChatBot";

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  bgDecorations?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  header,
  children,
  bgDecorations,
}) => (
  <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans relative">
    {bgDecorations}
    {sidebar}
    <div className="flex-1 flex flex-col h-screen overflow-hidden z-10">
      {header}
      <main className="flex-1 overflow-y-auto scrollbar-brand px-8 md:px-12 pb-12">
        {children}
      </main>
    </div>
    <ChatBot />
  </div>
);

export default DashboardLayout;
