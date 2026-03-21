import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { logClientEvent } from "./logging/clientLogger";

// Pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
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

// App Routes
function AppRoutes() {
  const { isAuthenticated, requiresProfileCompletion } = useAuth();

  useEffect(() => {
    logClientEvent("web.ui", "Web app loaded");
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/register"
        element={isAuthenticated && !requiresProfileCompletion ? <Navigate to="/home" replace /> : <RegisterPage />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={requiresProfileCompletion ? "/register" : "/home"} replace />
            : <LoginPage />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/care-request"
        element={
          <OperationalRoute>
            <CareRequestPage />
          </OperationalRoute>
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

      {/* Root and catch-all */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? (requiresProfileCompletion ? "/register" : "/home") : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (requiresProfileCompletion ? "/register" : "/home") : "/login"} replace />}
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
