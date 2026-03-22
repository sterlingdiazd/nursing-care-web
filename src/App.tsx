import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { logClientEvent } from "./logging/clientLogger";

// Pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminActionQueuePage from "./pages/AdminActionQueuePage";
import AdminCareRequestsPage from "./pages/AdminCareRequestsPage";
import AdminCareRequestDetailPage from "./pages/AdminCareRequestDetailPage";
import AdminCreateCareRequestPage from "./pages/AdminCreateCareRequestPage";
import AdminModulePlaceholderPage from "./pages/AdminModulePlaceholderPage";
import CareRequestPage from "./pages/CareRequestPage";
import CareRequestsListPage from "./pages/CareRequestsListPage";
import CareRequestDetailPage from "./pages/CareRequestDetailPage";
import AdminNurseProfilesPage from "./pages/AdminNurseProfilesPage";
import { UserProfileType } from "./types/auth";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f4b6e",
      light: "#46769b",
      dark: "#102d43",
    },
    secondary: {
      main: "#b7803c",
      light: "#d2a66c",
      dark: "#7f5724",
    },
    text: {
      primary: "#173042",
      secondary: "#5f7280",
    },
    background: {
      default: "#f4f2ec",
      paper: "#fffdf8",
    },
    success: {
      main: "#2c7a64",
    },
    info: {
      main: "#3b6c8d",
    },
    warning: {
      main: "#c18a42",
    },
    error: {
      main: "#b74f4d",
    },
  },
  typography: {
    fontFamily:
      '"Avenir Next", "Segoe UI Variable Text", "Segoe UI", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
      letterSpacing: "-0.04em",
      lineHeight: 1.02,
      fontSize: "clamp(3rem, 8vw, 5.4rem)",
    },
    h2: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
      letterSpacing: "-0.035em",
      lineHeight: 1.08,
    },
    h3: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
      letterSpacing: "-0.035em",
    },
    h4: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    overline: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--app-ink": "#173042",
          "--app-muted": "#60707a",
          "--app-surface": "#fffdf8",
          "--app-line": "rgba(23, 48, 66, 0.08)",
          "--app-gold": "#b7803c",
        },
        body: {
          background:
            "radial-gradient(circle at top left, rgba(40, 98, 131, 0.16), transparent 24%), linear-gradient(180deg, #f7f4ee 0%, #edf2f4 100%)",
          color: "#173042",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(23, 48, 66, 0.08)",
          boxShadow: "0 18px 42px rgba(21, 34, 48, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2.5 * 4,
          paddingInline: 20,
          paddingBlock: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 3 * 4,
          boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
          border: "1px solid rgba(23, 48, 66, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2 * 4,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 2.5 * 4,
            backgroundColor: "rgba(255,255,255,0.72)",
          },
        },
      },
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresProfileCompletion } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}

function OperationalRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profileType, requiresAdminReview, requiresProfileCompletion } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion) {
    return <Navigate to="/register" replace />;
  }

  if (requiresAdminReview && profileType === UserProfileType.Nurse) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function CareRequestCreateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profileType, requiresAdminReview, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion) {
    return <Navigate to="/register" replace />;
  }

  if (requiresAdminReview && profileType === UserProfileType.Nurse) {
    return <Navigate to="/home" replace />;
  }

  if (!roles.includes("Client") && !roles.includes("Admin")) {
    return <Navigate to="/care-requests" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion) {
    return <Navigate to="/register" replace />;
  }

  if (!roles.includes("Admin")) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function getDefaultAuthenticatedPath(roles: string[], requiresProfileCompletion: boolean) {
  if (requiresProfileCompletion) {
    return "/register";
  }

  return roles.includes("Admin") ? "/admin" : "/home";
}

function HomeRoute() {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion) {
    return <Navigate to="/register" replace />;
  }

  if (roles.includes("Admin")) {
    return <Navigate to="/admin" replace />;
  }

  return <HomePage />;
}

// App Routes
function AppRoutes() {
  const { isAuthenticated, requiresProfileCompletion, roles } = useAuth();
  const defaultAuthenticatedPath = getDefaultAuthenticatedPath(roles, requiresProfileCompletion);

  useEffect(() => {
    logClientEvent("web.ui", "Web app loaded");
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/register"
        element={isAuthenticated && !requiresProfileCompletion ? <Navigate to={defaultAuthenticatedPath} replace /> : <RegisterPage />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={defaultAuthenticatedPath} replace />
            : <LoginPage />
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
        path="/admin/clients"
        element={
          <AdminRoute>
            <AdminModulePlaceholderPage
              eyebrow="Clientes"
              title="La administracion de clientes ya tiene una ruta reservada."
              description="El tablero puede llevar a este modulo desde el conteo de clientes activos y la navegacion principal del portal."
              nextSliceSummary="La siguiente entrega anadira listado, detalle y acciones administrativas para clientes sin cambiar esta ubicacion."
            />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminModulePlaceholderPage
              eyebrow="Usuarios y acceso"
              title="La gobernanza de usuarios ya tiene su lugar dentro del portal."
              description="Esta ruta consolida la estructura para permisos, estados de cuenta y futuras acciones de acceso administrativo."
              nextSliceSummary="La siguiente entrega anadira busqueda, detalle y gestion de accesos en este modulo."
            />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminRoute>
            <AdminModulePlaceholderPage
              eyebrow="Notificaciones"
              title="El centro de notificaciones administrativo queda anclado desde esta base."
              description="El tablero ya puede dirigir aqui el conteo de avisos sin leer, aunque la bandeja completa se incorporara en la siguiente fase."
              nextSliceSummary="La siguiente entrega incorporara el centro de notificaciones con estados de leido, severidad y enlaces a entidades."
            />
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
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminModulePlaceholderPage
              eyebrow="Configuracion"
              title="La configuracion del portal ya tiene una ubicacion estable."
              description="Esta ruta fija la arquitectura para parametros administrativos sin inflar la consola ni mezclarla con flujos operativos."
              nextSliceSummary="La siguiente entrega anadira ajustes tipados y auditables dentro de este modulo."
            />
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
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
