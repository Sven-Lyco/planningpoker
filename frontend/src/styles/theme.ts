/**
 * Emotion theme tokens for the Planning Poker app.
 * Always consume via `useTheme()` – never hardcode color values in components.
 */
export const theme = {
  colors: {
    background: "#0F0E17",
    surface: "#1E1B2E",
    card: "#2D2640",
    primary: "#7C3AED",
    accent: "#06D6A0",
    warning: "#FF6B35",
    textPrimary: "#FFFFFE",
    textSecondary: "#A9A4C0",
  },
  radii: {
    sm: "6px",
    md: "12px",
    lg: "20px",
    full: "9999px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
  },
  fontSizes: {
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "20px",
    xxl: "28px",
  },
  shadows: {
    card: "0 4px 24px rgba(0,0,0,0.4)",
    glow: "0 0 16px rgba(124,58,237,0.5)",
  },
  transitions: {
    fast: "150ms ease",
    normal: "250ms ease",
  },
} as const;

export type AppTheme = typeof theme;
