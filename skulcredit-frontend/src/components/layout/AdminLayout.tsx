import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "./DashboardLayout";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "../../pages/AdminFlow/components/AdminTopBar";
import {
  DashboardSettings,
  DashboardSettingsProvider,
  loadSettings,
} from "../../pages/AdminFlow/components/DashboardSettingsDrawer";

const AdminLayout: React.FC = () => {
  const [settings,       setSettings]       = useState<DashboardSettings>(loadSettings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <DashboardSettingsProvider value={{ settings, setSettings }}>
      <DashboardLayout
        useSettings
        showChatBot={false}
        sidebar={
          <AdminSidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        }
        header={
          <AdminTopBar
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
        }
      >
        <Outlet />
      </DashboardLayout>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable={false}
        theme="colored"
      />
    </DashboardSettingsProvider>
  );
};

export default AdminLayout;
