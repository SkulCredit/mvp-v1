/**
 * AppRouter
 *
 * Public routes  → wrapped in <PublicRoute>
 *   /            – home / landing page
 *   /auth        – role-selector
 *   /auth/parent – parent login & register
 *   /auth/school – school login & register
 *   /auth/admin  – admin login
 *
 * School onboarding is also public: a school needs to register before
 * they have credentials to log in.
 *   /school/onboarding
 *
 * Protected routes → wrapped in <ProtectedRoute allowedRoles={[...]}>
 *
 *   PARENT  /parent/*   – single layout route (ParentLayout as outlet)
 *   SCHOOL  /school/*   – individually wrapped (no shared layout yet)
 *   ADMIN   /admin/*    – individually wrapped
 *
 * Any unknown path falls through to the catch-all → /
 */

import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import { AuthSpinner } from "../context/AuthContext";

// ── Lazy page imports ─────────────────────────────────────────────────────────

// Public / auth
const HomePage = React.lazy(() => import("../pages/Home/HomePage"));
const UnifiedAuthPage = React.lazy(
  () => import("../pages/Auth/UnifiedAuthPage"),
);
const ParentAuthPage = React.lazy(() => import("../pages/Auth/ParentAuthPage"));
const SchoolAuthPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolAuthPage"),
);
const AdminAuthPage = React.lazy(
  () => import("../pages/AdminFlow/AdminAuthPage"),
);
const SchoolOnboardingPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolOnboardingPage"),
);

// Parent flow
const ParentLayout = React.lazy(
  () => import("../pages/ParentFlow/ParentLayout"),
);
const ParentDashboardHomePage = React.lazy(
  () => import("../pages/ParentFlow/ParentDashboardHomePage"),
);
const ParentApplicationsPage = React.lazy(
  () => import("../pages/ParentFlow/MyApplicationsPage"),
);
const ParentRepaymentPage = React.lazy(
  () => import("../pages/ParentFlow/ParentRepaymentPage"),
);
const ParentVerificationPage = React.lazy(
  () => import("../pages/ParentFlow/ParentVerificationPage"),
);
const ParentSupportPage = React.lazy(
  () => import("../pages/ParentFlow/ParentSupportPage"),
);
const ParentSettingsPage = React.lazy(
  () => import("../pages/ParentFlow/ParentSettingsPage"),
);
const StudentDetailsPage = React.lazy(
  () => import("../pages/ParentFlow/StudentDetailsPage"),
);
const EligibilityTestPage = React.lazy(
  () => import("../pages/ParentFlow/EligibilityTestPage"),
);
const ServiceChargePage = React.lazy(
  () => import("../pages/ParentFlow/ServiceChargePage"),
);
const PaymentConfirmationPage = React.lazy(
  () => import("../pages/ParentFlow/PaymentConfirmationPage"),
);

// School flow
const SchoolDashboardPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolDashboardPage"),
);
const SchoolApplicationsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolApplicationsPage"),
);
const SchoolStudentsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolStudentsPage"),
);
const SchoolDisbursementPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolDisbursementPage"),
);
const SchoolVerificationSettingsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolVerificationSettingsPage"),
);
const SchoolSupportPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolSupportPage"),
);
const SchoolSettingsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolSettingsPage"),
);

// Admin flow
const AdminDashboardPage = React.lazy(
  () => import("../pages/AdminFlow/AdminDashboardPage"),
);

// ── Router ────────────────────────────────────────────────────────────────────

const AppRouter: React.FC = () => (
  <Router>
    <Suspense fallback={<AuthSpinner />}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <UnifiedAuthPage />
            </PublicRoute>
          }
        />

        <Route
          path="/auth/parent"
          element={
            <PublicRoute>
              <ParentAuthPage />
            </PublicRoute>
          }
        />

        <Route
          path="/auth/school"
          element={
            <PublicRoute>
              <SchoolAuthPage />
            </PublicRoute>
          }
        />

        <Route
          path="/auth/admin"
          element={
            <PublicRoute>
              <AdminAuthPage />
            </PublicRoute>
          }
        />

        <Route path="/school/onboarding" element={<SchoolOnboardingPage />} />
        <Route
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/parent/dashboard"
            element={<ParentDashboardHomePage />}
          />
          <Route
            path="/parent/applications"
            element={<ParentApplicationsPage />}
          />
          <Route path="/parent/repayment" element={<ParentRepaymentPage />} />
          <Route
            path="/parent/verification"
            element={<ParentVerificationPage />}
          />
          <Route path="/parent/support" element={<ParentSupportPage />} />
          <Route path="/parent/settings" element={<ParentSettingsPage />} />
          <Route path="/parent/details" element={<StudentDetailsPage />} />
          <Route path="/parent/eligibility" element={<EligibilityTestPage />} />
          <Route
            path="/parent/service-charge"
            element={<ServiceChargePage />}
          />
          <Route path="/parent/payment" element={<PaymentConfirmationPage />} />
        </Route>

        {/* ════════════════════════════════════════════════
            SCHOOL ROUTES  (role: "school")
            ════════════════════════════════════════════════ */}

        <Route
          path="/school/dashboard"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/applications"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/students"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/disbursement"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolDisbursementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/settings"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolVerificationSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/support"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolSupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/account-settings"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════
            ADMIN ROUTES  (role: "admin")
            ════════════════════════════════════════════════ */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════
            CATCH-ALL  →  home
            ════════════════════════════════════════════════ */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Router>
);

export default AppRouter;
