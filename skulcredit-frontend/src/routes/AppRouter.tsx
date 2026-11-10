import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import AdminLayout from "../components/layout/AdminLayout";
import { AuthSpinner } from "../context/AuthContext";

const HomePage = React.lazy(() => import("../pages/Home/HomePage"));
const UnifiedAuthPage = React.lazy(
  () => import("../pages/Auth/UnifiedAuthPage"),
);
const ParentAuthPage = React.lazy(() => import("../pages/Auth/ParentAuthPage"));
const SchoolAuthPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolAuthPage"),
);
const SchoolOnboardingPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolOnboardingPage"),
);

const SchoolVerificationPage = React.lazy(
  () => import("../pages/Public/SchoolVerificationPage"),
);
const AdminLoginPage = React.lazy(
  () => import("../pages/AdminFlow/AdminLoginPage"),
);
const AdminOtpPage = React.lazy(
  () => import("../pages/AdminFlow/AdminOtpPage"),
);

const StaffLoginPage = React.lazy(
  () => import("../pages/StaffFlow/StaffLoginPage"),
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
const StudentDetailsPage = React.lazy(
  () => import("../pages/ParentFlow/StudentDetailsPage"),
);
const EligibilityPage = React.lazy(
  () => import("../pages/ParentFlow/EligibilityPage"),
);
const ServiceChargePage = React.lazy(
  () => import("../pages/ParentFlow/ServiceChargePage"),
);
const PaymentConfirmationPage = React.lazy(
  () => import("../pages/ParentFlow/PaymentConfirmationPage"),
);
const ParentRepaymentPayPage = React.lazy(
  () => import("../pages/ParentFlow/ParentRepaymentPayPage"),
);

const SchoolDashboardPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolDashboardPage"),
);
const SchoolApplicationsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolApplicationsPage"),
);
const SchoolApplicationDetailPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolApplicationDetailPage"),
);
const SchoolStudentsPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolStudentsPage"),
);
const SchoolStudentDetailPage = React.lazy(
  () => import("../pages/SchoolFlow/SchoolStudentDetailPage"),
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

const AdminDashboardPage = React.lazy(
  () => import("../pages/AdminFlow/AdminDashboardPage"),
);

const AdminParentsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminParentsPage"),
);

const FundingPartnerDisbursementPage = React.lazy(
  () => import("../pages/FundingPartner/FundingPartnerDisbursementPage"),
);
const AdminApplicationsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminApplicationsPage"),
);
const AdminApplicationDetailPage = React.lazy(
  () => import("../pages/AdminFlow/AdminApplicationDetailPage"),
);
const AdminDisbursementsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminDisbursementsPage"),
);
const AdminSchoolsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminSchoolsPage"),
);
const AdminSchoolProfilePage = React.lazy(
  () => import("../pages/AdminFlow/AdminSchoolProfilePage"),
);
const AdminParentProfilePage = React.lazy(
  () => import("../pages/AdminFlow/AdminParentProfilePage"),
);
const AdminFundingPartnersPage = React.lazy(
  () => import("../pages/AdminFlow/AdminFundingPartnersPage"),
);
const AdminSettingsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminSettingsPage"),
);
const AdminUsersPage = React.lazy(
  () => import("../pages/AdminFlow/AdminUsersPage"),
);
const AdminRolesPage = React.lazy(
  () => import("../pages/AdminFlow/AdminRolesPage"),
);
const AdminCompliancePage = React.lazy(
  () => import("../pages/AdminFlow/AdminCompliancePage"),
);
const AdminSupportPage = React.lazy(
  () => import("../pages/AdminFlow/AdminSupportPage"),
);
const AdminAuditLogPage = React.lazy(
  () => import("../pages/AdminFlow/AdminAuditLogPage"),
);
const AdminAnalyticsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminAnalyticsPage"),
);
const AdminDisbursementRequestsPage = React.lazy(
  () => import("../pages/AdminFlow/AdminDisbursementRequestsPage"),
);
const AdminProfilePage = React.lazy(
  () => import("../pages/AdminFlow/AdminProfilePage"),
);

const CSLayout = React.lazy(() => import("../components/layout/CSLayout"));
const CSDashboardPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSDashboardPage"),
);
const CSIssuesPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSIssuesPage"),
);
const CSTicketDetailPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSTicketDetailPage"),
);
const CSApplicationsPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSApplicationsPage"),
);
const CSSchoolsPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSSchoolsPage"),
);
const CSParentsPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSParentsPage"),
);
const CSProfilePage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSProfilePage"),
);
const CSPlaceholderPage = React.lazy(
  () => import("../pages/CustomerServiceFlow/CSPlaceholderPage"),
);

const FinanceDashboardPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceDashboardPage"),
);
const FinanceNewDisbursementPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceNewDisbursementPage"),
);
const FinanceDisbursementsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceDisbursementsPage"),
);
const FinanceSchoolVerificationPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceSchoolVerificationPage"),
);
const FinanceRepaymentsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceRepaymentsPage"),
);
const FinanceOutstandingBalancesPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceOutstandingBalancesPage"),
);
const FinanceOverdueAccountsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceOverdueAccountsPage"),
);
const FinanceSchoolRecordsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceSchoolRecordsPage"),
);
const FinanceCollectionFollowUpPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceCollectionFollowUpPage"),
);
const FinanceFinancialReportsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceFinancialReportsPage"),
);
const FinanceAuditLogsPage = React.lazy(
  () => import("../pages/FinanceFlow/FinanceAuditLogsPage"),
);

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
        <Route path="/school/onboarding" element={<SchoolOnboardingPage />} />
        <Route
          path="/admin/auth/login"
          element={
            <PublicRoute>
              <AdminLoginPage />
            </PublicRoute>
          }
        />
        <Route path="/admin/auth/verify-otp" element={<AdminOtpPage />} />
        <Route
          path="/auth/staff"
          element={
            <PublicRoute>
              <StaffLoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/admin"
          element={<Navigate to="/admin/auth/login" replace />}
        />
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
          <Route path="/parent/eligibility" element={<EligibilityPage />} />
          <Route
            path="/parent/service-charge"
            element={<ServiceChargePage />}
          />
          <Route path="/parent/payment" element={<PaymentConfirmationPage />} />
          <Route
            path="/parent/repayment-pay"
            element={<ParentRepaymentPayPage />}
          />
        </Route>
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
          path="/school/applications/:id"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolApplicationDetailPage />
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
          path="/school/students/:id"
          element={
            <ProtectedRoute allowedRoles={["school"]}>
              <SchoolStudentDetailPage />
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
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route
            path="/admin/applications"
            element={<AdminApplicationsPage />}
          />
          <Route
            path="/admin/applications/:id"
            element={<AdminApplicationDetailPage />}
          />
          <Route path="/admin/parents" element={<AdminParentsPage />} />
          <Route
            path="/admin/parents/:id"
            element={<AdminParentProfilePage />}
          />
          <Route
            path="/admin/disbursements"
            element={<AdminDisbursementsPage />}
          />
          <Route path="/admin/schools" element={<AdminSchoolsPage />} />
          <Route
            path="/admin/schools/:id"
            element={<AdminSchoolProfilePage />}
          />
          <Route
            path="/admin/funding-partners"
            element={<AdminFundingPartnersPage />}
          />
          <Route
            path="/admin/funding-partners/requests"
            element={<AdminDisbursementRequestsPage />}
          />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/roles" element={<AdminRolesPage />} />
          <Route path="/admin/compliance" element={<AdminCompliancePage />} />
          <Route path="/admin/support" element={<AdminSupportPage />} />
          <Route path="/admin/audit" element={<AdminAuditLogPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>
        <Route path="/cs" element={<Navigate to="/cs/dashboard" replace />} />
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer_service",
                "customer_service_manager",
                "risk_management",
              ]}
            >
              <CSLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/cs/dashboard" element={<CSDashboardPage />} />
          <Route path="/cs/issues" element={<CSIssuesPage />} />
          <Route path="/cs/issues/:id" element={<CSTicketDetailPage />} />
          <Route path="/cs/applications" element={<CSApplicationsPage />} />
          <Route path="/cs/schools" element={<CSSchoolsPage />} />
          <Route path="/cs/parents" element={<CSParentsPage />} />
          <Route path="/cs/profile" element={<CSProfilePage />} />
          <Route
            path="/cs/escalations"
            element={
              <CSPlaceholderPage
                title="Escalations"
                description="View and manage escalated issues that require higher-level support."
                icon="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            }
          />
          <Route
            path="/cs/knowledge"
            element={
              <CSPlaceholderPage
                title="Knowledge Base"
                description="Browse articles, FAQs and guides to help resolve customer issues faster."
                icon="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
              />
            }
          />
          <Route
            path="/cs/reports"
            element={
              <CSPlaceholderPage
                title="Reports"
                description="View support metrics, ticket resolution rates, and performance reports."
                icon="M18 20V10M12 20V4M6 20v-6"
              />
            }
          />
        </Route>
        <Route
          path="/funding-partner/disbursement/:id"
          element={<FundingPartnerDisbursementPage />}
        />
        <Route
          path="/finance"
          element={<Navigate to="/finance/dashboard" replace />}
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={["accountant"]}>
              <React.Fragment />
            </ProtectedRoute>
          }
        >
          <Route path="/finance/dashboard" element={<FinanceDashboardPage />} />
          <Route
            path="/finance/disbursements"
            element={<FinanceDisbursementsPage />}
          />
          <Route
            path="/finance/disbursements/history"
            element={<FinanceDisbursementsPage />}
          />
          <Route
            path="/finance/disbursements/new"
            element={<FinanceNewDisbursementPage />}
          />
          <Route
            path="/finance/disbursements/verification"
            element={<FinanceSchoolVerificationPage />}
          />
          <Route
            path="/finance/repayments"
            element={<FinanceRepaymentsPage />}
          />
          <Route
            path="/finance/repayments/history"
            element={<FinanceRepaymentsPage />}
          />
          <Route
            path="/finance/repayments/outstanding"
            element={<FinanceOutstandingBalancesPage />}
          />
          <Route
            path="/finance/repayments/overdue"
            element={<FinanceOverdueAccountsPage />}
          />
          <Route
            path="/finance/repayments/follow-up"
            element={<FinanceCollectionFollowUpPage />}
          />
          <Route
            path="/finance/records/schools"
            element={<FinanceSchoolRecordsPage />}
          />
          <Route
            path="/finance/records"
            element={<FinanceSchoolRecordsPage />}
          />
          <Route
            path="/finance/reconciliation"
            element={<FinanceSchoolRecordsPage />}
          />
          <Route
            path="/finance/reports"
            element={<FinanceFinancialReportsPage />}
          />
          <Route path="/finance/settings" element={<FinanceAuditLogsPage />} />
        </Route>
        <Route
          path="/verify-school/:token"
          element={<SchoolVerificationPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />{" "}
      </Routes>
    </Suspense>
  </Router>
);

export default AppRouter;
