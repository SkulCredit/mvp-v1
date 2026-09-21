import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  DashboardLayout,
  DashboardTopBar,
  ParentSidebar,
  TopBarControls,
} from "../../components/layout";
import Icon from "../../components/Icon";

const ParentLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const searchBar = (
    <div className="hidden md:flex items-center w-full max-w-sm">
      <div className="relative w-full">
        <Icon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search applications, schools…"
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-brand/40 rounded-full text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
                     transition-all shadow-sm placeholder:text-slate-400"
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout
      sidebar={
        <ParentSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      }
      header={
        <DashboardTopBar
          left={searchBar}
          rightExtra={<TopBarControls />}
          onMobileMenuOpen={() => setMobileNavOpen(true)}
          className="px-6 md:px-8"
        />
      }
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default ParentLayout;
