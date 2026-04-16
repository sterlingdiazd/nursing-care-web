import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { logClientEvent } from "./logging/clientLogger";
import { appTheme } from "./design-system/theme";

// Pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminActionQueuePage from "./pages/AdminActionQueuePage";
import AdminCareRequestsPage from "./pages/AdminCareRequestsPage";
import AdminCareRequestDetailPage from "./pages/AdminCareRequestDetailPage";
import AdminCreateCareRequestPage from "./pages/AdminCreateCareRequestPage";
import AdminCreateAdminPage from "./pages/AdminCreateAdminPage";
import AdminCreateClientPage from "./pages/AdminCreateClientPage";
import AdminClientDetailPage from "./pages/AdminClientDetailPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminModulePlaceholderPage from "./pages/AdminModulePlaceholderPage";
import AdminPricingCatalogPage from "./pages/AdminPricingCatalogPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminAuditLogPage from "./pages/AdminAuditLogPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import CareRequestPage from "./pages/CareRequestPage";
import CareRequestsListPage from "./pages/CareRequestsListPage";
import CareRequestDetailPage from "./pages/CareRequestDetailPage";
import AdminNurseProfilesPage from "./pages/AdminNurseProfilesPage";
import AdminNurseProfileDetailPage from "./pages/AdminNurseProfileDetailPage";
import AdminCreateNurseProfilePage from "./pages/AdminCreateNurseProfilePage";
import AdminEditNurseProfilePage from "./pages/AdminEditNurseProfilePage";
import AdminReviewNurseProfilePage from "./pages/AdminReviewNurseProfilePage";
import AdminClientsPage from "./pages/AdminClientsPage";
import AdminPayrollPage from "./pages/AdminPayrollPage";
import AdminShiftsPage from "./pages/AdminShiftsPage";
import AccountPage from "./pages/AccountPage";
import { UserProfileType } from "./types/auth";

const theme = appTheme;

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}

function OperationalRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profileType, requiresAdminReview, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return <Navigate to="/register" replace />;
  }

  if (requiresAdminReview && profileType === UserProfileType.NURSE) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function CareRequestCreateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profileType, requiresAdminReview, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return <Navigate to="/register" replace />;
  }

  if (requiresAdminReview && profileType === UserProfileType.NURSE) {
    return <Navigate to="/home" replace />;
  }

  if (!roles.includes("CLIENT") && !roles.includes("ADMIN")) {
    return <Navigate to="/care-requests" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return <Navigate to="/register" replace />;
  }

  if (!roles.includes("ADMIN")) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function getDefaultAuthenticatedPath(roles: string[], requiresProfileCompletion: boolean) {
  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return "/register";
  }

  return roles.includes("ADMIN") ? "/admin" : "/home";
}

function HomeRoute() {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");

  if (requiresProfileCompletion || !isFullyRegistered) {
    return <Navigate to="/register" replace />;
  }

  if (roles.includes("ADMIN")) {
    return <Navigate to="/admin" replace />;
  }

  return <HomePage />;
}

// App Routes
function AppRoutes() {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();
  const isFullyRegistered = roles.includes("ADMIN") || roles.includes("NURSE") || roles.includes("CLIENT");
  const needsRegistration = requiresProfileCompletion || !isFullyRegistered;
  const defaultAuthenticatedPath = getDefaultAuthenticatedPath(roles, requiresProfileCompletion);

  useEffect(() => {
    logClientEvent("web.ui", "Web app loaded");
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/register"
        element={
          isAuthenticated && !needsRegistration ? (
            <Navigate to={defaultAuthenticatedPath} replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          isAuthenticated && !needsRegistration ? (
            <Navigate to={defaultAuthenticatedPath} replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated && !needsRegistration ? (
            <Navigate to={defaultAuthenticatedPath} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomeRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/action-items"
        element={
          <AdminRoute>
            <AdminActionQueuePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/care-requests/new"
        element={
          <AdminRoute>
            <AdminCreateCareRequestPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/care-requests/:id"
        element={
          <AdminRoute>
            <AdminCareRequestDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/care-requests"
        element={
          <AdminRoute>
            <AdminCareRequestsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/care-request"
        element={
          <CareRequestCreateRoute>
            <CareRequestPage />
          </CareRequestCreateRoute>
        }
      />
      <Route
        path="/care-requests"
        element={
          <OperationalRoute>
            <CareRequestsListPage />
          </OperationalRoute>
        }
      />
      <Route
        path="/care-requests/:id"
        element={
          <OperationalRoute>
            <CareRequestDetailPage />
          </OperationalRoute>
        }
      />
      <Route
        path="/admin/nurse-profiles"
        element={
          <AdminRoute>
            <AdminNurseProfilesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/nurse-profiles/new"
        element={
          <AdminRoute>
            <AdminCreateNurseProfilePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/nurse-profiles/:id"
        element={
          <AdminRoute>
            <AdminNurseProfileDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/nurse-profiles/:id/edit"
        element={
          <AdminRoute>
            <AdminEditNurseProfilePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/nurse-profiles/:id/review"
        element={
          <AdminRoute>
            <AdminReviewNurseProfilePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <AdminRoute>
            <AdminClientsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients/new"
        element={
          <AdminRoute>
            <AdminCreateClientPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients/:id"
        element={
          <AdminRoute>
            <AdminClientDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users/create-admin"
        element={
          <AdminRoute>
            <AdminCreateAdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <AdminRoute>
            <AdminUserDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminRoute>
            <AdminNotificationsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminRoute>
            <AdminAuditLogPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminReportsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <AdminRoute>
            <AdminModulePlaceholderPage
              eyebrow="Alertas criticas"
              title="La bandeja de alertas severas ya existe como destino del tablero."
              description="Este espacio queda reservado para incidentes de alto impacto que deberan sobresalir sobre la mensajeria general."
              nextSliceSummary="La siguiente entrega incorporara alertas criticas del negocio y del sistema con seguimiento visible."
            />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/catalog"
        element={
          <AdminRoute>
            <AdminPricingCatalogPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettingsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payroll"
        element={
          <AdminRoute>
            <AdminPayrollPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/shifts"
        element={
          <AdminRoute>
            <AdminShiftsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      {/* Root and catch-all */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? defaultAuthenticatedPath : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? defaultAuthenticatedPath : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
