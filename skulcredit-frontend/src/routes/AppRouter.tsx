import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const HomePage = React.lazy(() => import("../pages/Home/HomePage"));
const UnifiedAuthPage = React.lazy(
  () => import("../pages/Auth/UnifiedAuthPage"),
);
const ParentAuthPage = React.lazy(() => import("../pages/Auth/ParentAuthPage"));

const EligibilityTestPage = React.lazy(
  () => import("../pages/ParentFlow/EligibilityTestPage"),
);
const StudentDetailsPage = React.lazy(
  () => import("../pages/ParentFlow/StudentDetailsPage"),
);
const ServiceChargePage = React.lazy(
  () => import("../pages/ParentFlow/ServiceChargePage"),
);
const PaymentConfirmationPage = React.lazy(
  () => import("../pages/ParentFlow/PaymentConfirmationPage"),
);

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

const SchoolAuthPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolAuthPage"),
);
const SchoolOnboardingPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolOnboardingPage"),
);
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

const AdminAuthPage = React.lazy(
  () => import("../pages/AdminFlow/AdminAuthPage"),
);
const AdminDashboardPage = React.lazy(
  () => import("../pages/AdminFlow/AdminDashboardPage"),
);

const Loader: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center">
    Loading...
  </div>
);

const AppRouter: React.FC = () => (
  <Router>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/auth" element={<UnifiedAuthPage />} />
        <Route path="/auth/parent" element={<ParentAuthPage />} />
        <Route path="/auth/school" element={<SchoolAuthPage />} />
        <Route path="/auth/admin" element={<AdminAuthPage />} />

        <Route path="/parent/service-charge" element={<ServiceChargePage />} />
        <Route path="/parent/payment" element={<PaymentConfirmationPage />} />
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
        </Route>

        <Route path="/school/onboarding" element={<SchoolOnboardingPage />} />
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
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Router>
);

export default AppRouter;
