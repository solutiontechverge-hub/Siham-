/** Desired Location tag (Figma) — same styles for Fixed Location. */
export const locationModeChipSx = {
  height: "auto",
  width: "fit-content",
  minHeight: 0,
  borderRadius: 0,
  opacity: 1,
  bgcolor: "#E9F8F9",
  color: "#21B8BF",
  fontFamily: '"Plus Jakarta Sans", inherit',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: "20px",
  letterSpacing: "-0.02em",
  "& .MuiChip-label": {
    px: 0.75,
    py: 0,
    display: "block",
    lineHeight: "20px",
    letterSpacing: "-0.02em",
  },
} as const;
