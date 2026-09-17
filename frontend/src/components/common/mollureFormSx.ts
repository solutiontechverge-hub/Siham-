import { alpha } from "@mui/material/styles";
import { mollureBodySx } from "../../theme/mollureHierarchy";

/** White rounded outlined inputs used by business/finance drawers. */
export const mollureWhiteFieldInputSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" },
} as const;

/** Dense calendar duration fields (8px radius). */
export const mollureDenseFieldInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "#fff",
    fontSize: 14,
    fontWeight: 700,
  },
  "& .MuiOutlinedInput-input": {
    py: 1.1,
    px: 1.5,
  },
} as const;

/** Responsive two-column row used by service/team form drawers. */
export const mollureTwoColumnRowSx = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  gap: 1.5,
  width: "100%",
  alignItems: "stretch",
} as const;

export const mollureTwoColumnCellSx = {
  flex: 1,
  minWidth: 0,
  width: "100%",
} as const;

type Extra = Record<string, unknown> | undefined;

/** Dense MenuItem row used by client/finance overflow menus. */
export function mollureMenuItemSx(navy: string, extra?: Extra) {
  return mollureBodySx(navy, {
    borderRadius: "8px",
    my: 0.25,
    ...extra,
  });
}

/** Dense Menu paper shell. */
export function mollureMenuPaperSx(navy: string, extra?: Extra) {
  return {
    borderRadius: "10px",
    border: `1px solid ${alpha(navy, 0.1)}`,
    boxShadow: "0 14px 30px rgba(16,35,63,0.12)",
    mt: 0.75,
    p: 0.5,
    ...extra,
  };
}

/** Dense card/paper shell used across client/finance/setup. */
export function mollureDensePaperSx(
  navy: string,
  opts?: { borderAlpha?: number; shadow?: "soft" | "lift"; extra?: Extra },
) {
  const borderAlpha = opts?.borderAlpha ?? 0.08;
  const shadow =
    opts?.shadow === "lift"
      ? "0 10px 22px rgba(16, 35, 63, 0.05)"
      : "0 6px 14px rgba(16, 35, 63, 0.05)";
  return {
    borderRadius: "10px",
    border: `1px solid ${alpha(navy, borderAlpha)}`,
    bgcolor: "#fff",
    boxShadow: shadow,
    overflow: "hidden",
    ...opts?.extra,
  };
}

/** Compact 28px edit/delete icon button. */
export const mollureDenseIconButtonSx = {
  width: 28,
  height: 28,
  borderRadius: "8px",
} as const;
