import React, { ReactNode } from 'react';

interface AppFlowHeaderProps {
  center?: ReactNode;
  right?: ReactNode;
}

const AppFlowHeader: React.FC<AppFlowHeaderProps> = ({ center, right }) => (
  <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black select-none">
        S
      </div>
      <span className="font-extrabold text-brand text-xl tracking-tight hidden sm:block">SkulCredit</span>
    </div>
    {center && <div className="hidden md:block">{center}</div>}
    {right && <div>{right}</div>}
  </header>
);

export default AppFlowHeader;
