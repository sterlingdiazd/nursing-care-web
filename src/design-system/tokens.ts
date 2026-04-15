export const designTokens = {
  color: {
    ink: {
      primary: "#111827",
      secondary: "#4b5563",
      muted: "#6b7280",
      inverse: "#ffffff",
      accent: "#007aff",
      danger: "#be123c",
      warning: "#92400e",
    },
    surface: {
      canvas: "#f2f4f7",
      primary: "#ffffff",
      secondary: "#f8fafc",
      accent: "#eff6ff",
      warning: "#fff7ed",
      danger: "#fff1f2",
      success: "#ecfdf5",
    },
    border: {
      subtle: "#e5e7eb",
      strong: "#d1d5db",
      accent: "#bfdbfe",
      warning: "#fed7aa",
      danger: "#fecdd3",
      success: "#bbf7d0",
    },
    status: {
      infoBg: "#dbeafe",
      infoText: "#1e40af",
      successBg: "#d1fae5",
      successText: "#065f46",
      warningBg: "#fef3c7",
      warningText: "#92400e",
      dangerBg: "#fee2e2",
      dangerText: "#991b1b",
    },
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    pill: 999,
  },
  typography: {
    fontFamily:
      '"Avenir Next", "Segoe UI Variable Text", "Segoe UI", "Helvetica Neue", sans-serif',
    displayFamily:
      '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
  },
  shadow: {
    card: "0 18px 36px rgba(17, 24, 39, 0.08)",
    raised: "0 18px 40px rgba(17, 24, 39, 0.09)",
    accent: "0 10px 24px rgba(0, 122, 255, 0.22)",
  },
} as const;

export type DesignTokens = typeof designTokens;
