// Design tokens — adheres to "Gym App Design Guide (React Native)"
// Iron (#12141C) background, Slate (#1E2230) cards, Steel (#2C3145) borders,
// Volt Violet (#7C5CFF) primary actions, and Flame Coral (#FF6B4A) accents.

export const colors = {
  // Theme palette per Section 2
  bg: "#12141C",
  card: "#1E2230",
  border: "#2C3145",
  primary: "#7C5CFF",
  accent: "#FF6B4A",
  success: "#2EE6A6",
  warning: "#FFC53D",
  error: "#FF4D6D",
  text: "#F2F3F7",
  textDim: "#A0A6BA",

  // Gradients
  gradient: ["#7C5CFF", "#FF6B4A"] as const,       // main CTA, streak card
  gradientCool: ["#7C5CFF", "#38BDF8"] as const,   // progress, charts
  gradientDark: ["transparent", "rgba(18,20,28,0.92)"] as const, // photo overlays
  gradientHero: ["rgba(18,20,28,0.35)", "rgba(18,20,28,0.88)", "#12141C"] as const,

  // Backwards compatibility aliases
  surface: "#1E2230",
  background: "#12141C",
  textPrimary: "#F2F3F7",
  textSecondary: "#A0A6BA",
  danger: "#FF4D6D",
};

export const darkColors = colors;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
  card: 16,
  button: 16,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const space = spacing;

export const typography = {
  display: { fontSize: 32, fontWeight: "700" as const, letterSpacing: -0.5 },
  stats: { fontSize: 48, fontWeight: "700" as const },
  statsLarge: { fontSize: 72, fontWeight: "700" as const },
  h2: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "500" as const },
  label: { fontSize: 12, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
};

// Status → color mapping used by <StatusBadge> and list cards
export type SubscriptionStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT";

export const statusColor: Record<SubscriptionStatus, string> = {
  ACTIVE: colors.success,
  EXPIRING: colors.warning,
  EXPIRED: colors.error,
  CANCELLED: colors.textDim,
  PENDING_PAYMENT: colors.warning,
};

// Marketing-only palette — updated to align with the athletic dark system
export const marketingColors = {
  ink: "#12141C",
  paper: "#12141C",
  hot: "#FF6B4A",
  warm: "#7C5CFF",
  mutedLight: "#A0A6BA",
};
