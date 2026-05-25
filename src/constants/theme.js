// ─── Design tokens ─────────────────────────────────────────
// Color contrast updated to meet WCAG AA 4.5:1 ratio on #07080f background
const T = {
  bg: "#07080f",
  surface: "#0e1018",
  card: "#13161f",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  rose: "#f43f5e",
  roseGlow: "rgba(244,63,94,0.25)",
  gold: "#f59e0b",
  goldGlow: "rgba(245,158,11,0.2)",
  teal: "#14b8a6",
  tealGlow: "rgba(20,184,166,0.2)",
  violet: "#8b5cf6",
  violetGlow: "rgba(139,92,246,0.2)",
  text: "#f1f5f9",
  textMid: "#94a3b8",      // ~5.5:1 contrast on #07080f - passes WCAG AA
  textDim: "#7d8ba0",      // ~4.6:1 contrast on #07080f - passes WCAG AA (was #475569 ~3:1)
  success: "#22c55e",
  error: "#f43f5e",
};

export default T;
