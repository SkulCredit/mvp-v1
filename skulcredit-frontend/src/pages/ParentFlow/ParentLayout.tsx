import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  DashboardLayout,
  DashboardTopBar,
  ParentSidebar,
  TopBarControls,
} from "../../components/layout";
import GlobalSearch from "../../components/layout/GlobalSearch";

const ParentLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
          left={<GlobalSearch />}
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
