import { alpha, type Theme } from "@mui/material/styles";

/** Shared Fixed/Desired location top-tab shell styles (visual tokens unchanged). */
export function locationTopTabsPaperSx() {
  return {
    width: "100%",
    ml: 0,
    mr: 0,
    borderRadius: "8px",
    bgcolor: "transparent",
    border: "none",
    boxShadow: "none",
    px: 0,
    py: 0,
  };
}

export function locationTopTabsStackSx(theme: Theme) {
  const navy = theme.palette.mollure.navy;
  return {
    overflowX: "auto" as const,
    position: "relative" as const,
    bgcolor: "transparent",
    width: "100%",
    justifyContent: "space-between",
    "&::-webkit-scrollbar": { display: "none" },
    scrollbarWidth: "none" as const,
    msOverflowStyle: "none" as const,
    "&:after": {
      content: '""',
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: 1,
      bgcolor: alpha(navy, 0.16),
    },
  };
}

export function locationTopTabLinkSx(theme: Theme, active: boolean) {
  const navy = theme.palette.mollure.navy;
  return {
    textDecoration: "none",
    whiteSpace: "nowrap",
    flex: "1 1 0",
    minWidth: { xs: 72, md: 0 },
    textAlign: "center",
    letterSpacing: "-0.01em",
    bgcolor: "#fff",
    "&:hover": { bgcolor: "#fff" },
    color: active
      ? theme.palette.text.primary
      : alpha(theme.palette.text.secondary, 0.75),
    fontSize: { xs: 13, sm: 14, md: 16 },
    pt: { xs: 1.25, md: 1.6 },
    pb: { xs: 1.2, md: 1.55 },
    fontWeight: active ? 700 : 500,
    position: "relative",
    zIndex: 1,
    borderRight: `1px solid ${alpha(navy, 0.14)}`,
    "&:last-of-type": { borderRight: "none" },
    "&:after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      bgcolor: active ? theme.palette.primary.main : "transparent",
      borderRadius: 0,
    },
  };
}
