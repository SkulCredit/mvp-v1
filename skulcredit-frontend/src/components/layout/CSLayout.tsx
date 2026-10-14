import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "./DashboardLayout";
import CSSidebar from "./CSSidebar";
import CSTopBar from "../../pages/CustomerServiceFlow/components/CSTopBar";

const CSLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <DashboardLayout
        sidebar={
          <CSSidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        }
        header={
          <CSTopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
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
    </>
  );
};

export default CSLayout;
