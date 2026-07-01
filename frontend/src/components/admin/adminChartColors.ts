/** Chart palette derived from Mollure theme tokens — no off-brand colors */
export const ADMIN_CHART_COLORS = {
  primary: "#21B8BF",
  primaryDark: "#149CA7",
  stackDark: "#169BA1",
  stackMid: "#21B8BF",
  stackLight: "#62C4C8",
  stackPale: "#9DD8DB",
  navy: "#344A66",
  slate: "#71819A",
  surface: "#F7FBFD",
  mintSoft: "#E8FBF7",
} as const;

export const ADMIN_CHART_SERIES = [
  ADMIN_CHART_COLORS.stackDark,
  ADMIN_CHART_COLORS.stackMid,
  ADMIN_CHART_COLORS.stackLight,
  ADMIN_CHART_COLORS.stackPale,
] as const;
