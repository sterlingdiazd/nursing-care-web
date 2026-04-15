import { createTheme } from "@mui/material/styles";

import { designTokens } from "./tokens";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: designTokens.color.ink.accent,
      light: "#60a5fa",
      dark: "#0056b3",
      contrastText: designTokens.color.ink.inverse,
    },
    secondary: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#475569",
      contrastText: designTokens.color.ink.inverse,
    },
    text: {
      primary: designTokens.color.ink.primary,
      secondary: designTokens.color.ink.secondary,
    },
    background: {
      default: designTokens.color.surface.canvas,
      paper: designTokens.color.surface.primary,
    },
    success: {
      main: designTokens.color.status.successText,
    },
    info: {
      main: designTokens.color.status.infoText,
    },
    warning: {
      main: designTokens.color.status.warningText,
    },
    error: {
      main: designTokens.color.status.dangerText,
    },
    divider: designTokens.color.border.subtle,
  },
  typography: {
    fontFamily: designTokens.typography.fontFamily,
    h1: {
      fontFamily: designTokens.typography.displayFamily,
      fontWeight: 700,
      letterSpacing: "-0.04em",
      lineHeight: 1.02,
      fontSize: "clamp(3rem, 8vw, 5.4rem)",
    },
    h2: {
      fontFamily: designTokens.typography.displayFamily,
      fontWeight: 700,
      letterSpacing: "-0.035em",
      lineHeight: 1.08,
    },
    h3: {
      fontFamily: designTokens.typography.displayFamily,
      fontWeight: 700,
      letterSpacing: "-0.035em",
    },
    h4: {
      fontFamily: designTokens.typography.displayFamily,
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
    borderRadius: designTokens.radius.md,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--app-ink": designTokens.color.ink.primary,
          "--app-muted": designTokens.color.ink.muted,
          "--app-surface": designTokens.color.surface.primary,
          "--app-line": designTokens.color.border.subtle,
          "--app-accent": designTokens.color.ink.accent,
          "--app-soft-accent": designTokens.color.surface.accent,
          "--app-warning": designTokens.color.surface.warning,
        },
        "html, body, #root": {
          minHeight: "100%",
        },
        body: {
          background:
            "radial-gradient(circle at top left, rgba(191, 219, 254, 0.32), transparent 24%), radial-gradient(circle at top right, rgba(229, 231, 235, 0.36), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #f2f4f7 46%, #eef2f7 100%)",
          color: designTokens.color.ink.primary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${designTokens.color.border.subtle}`,
          boxShadow: designTokens.shadow.raised,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.pill,
          paddingInline: 20,
          paddingBlock: 10,
        },
        containedPrimary: {
          boxShadow: designTokens.shadow.accent,
        },
        outlined: {
          borderColor: designTokens.color.border.strong,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.xxl,
          boxShadow: designTokens.shadow.card,
          border: `1px solid ${designTokens.color.border.subtle}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.pill,
        },
      },
    },
  },
});
